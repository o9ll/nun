// Nun Client Installer  — DevBuild
// Copyright (c) 2026 o9. All rights reserved.
// Build: see build.ps1

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("Nun Installer")]
[assembly: AssemblyDescription("Installer for Nun — Discord client mod")]
[assembly: AssemblyCompany("Nun")]
[assembly: AssemblyProduct("Nun")]
[assembly: AssemblyCopyright("© 2026 o9. All rights reserved.")]
[assembly: AssemblyVersion("1.14.13.0")]
[assembly: AssemblyFileVersion("1.14.13.0")]
[assembly: AssemblyTrademark("Nun")]

// ─────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────

sealed class DiscordInstall
{
    public string Name;
    public string ResourcesPath;
    public bool   IsPatched;
    public string DisplayPath;
}

sealed class DiscordComboItem
{
    public string Label;
    public string BasePath;
    public string ResourcesPath;
    public bool   IsInstalled;
    public bool   IsPatched;

    public override string ToString()
    {
        var status = !IsInstalled ? " (not installed)" : (IsPatched ? " (Nun installed)" : "");
        return Label + "  —  " + BasePath + status;
    }
}

// ─────────────────────────────────────────────────────────────────────
// Logic  (pure static — zero UI dependency)
// ─────────────────────────────────────────────────────────────────────

static class Logic
{
    const string RELEASE_API  = "https://api.github.com/repos/o9ll/nun/releases/latest";
    const string UA           = "NunInstaller/1.14.13.0 (+https://github.com/o9ll/nun)";
    const string ASAR         = "desktop.asar";
    const string CHECKSUMS    = "checksums.txt";
    const string OPENASAR_URL = "https://github.com/GooseMod/OpenAsar/releases/download/nightly/app.asar";

    public static void InitNetwork()
    {
        try
        {
            ServicePointManager.SecurityProtocol =
                (SecurityProtocolType)3072 |
                (SecurityProtocolType)12288;
            ServicePointManager.DefaultConnectionLimit = 4;
        }
        catch { }
    }

    public static string DataDir
    {
        get
        {
            var env = Environment.GetEnvironmentVariable("EQUICORD_USER_DATA_DIR");
            if (!string.IsNullOrEmpty(env)) return env;
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (string.IsNullOrEmpty(appData))
                appData = Path.Combine(
                    Environment.GetEnvironmentVariable("USERPROFILE") ?? @"C:\Users\Default",
                    "AppData", "Roaming");
            return Path.Combine(appData, "Nun");
        }
    }

    public static string AsarTarget { get { return Path.Combine(DataDir, "equicord.asar"); } }

    public static bool IsInstalled { get { return File.Exists(AsarTarget); } }

    public static List<DiscordInstall> FindDiscord()
    {
        var result = new List<DiscordInstall>();
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrEmpty(local))
        {
            var profile = Environment.GetEnvironmentVariable("USERPROFILE");
            if (!string.IsNullOrEmpty(profile))
                local = Path.Combine(profile, "AppData", "Local");
        }
        if (string.IsNullOrEmpty(local) || !Directory.Exists(local))
            return result;

        var names   = new[] { "Stable", "Canary", "PTB" };
        var folders = new[] { "Discord", "DiscordCanary", "DiscordPTB" };

        for (int i = 0; i < names.Length; i++)
        {
            try
            {
                var baseDir = Path.Combine(local, folders[i]);
                if (!Directory.Exists(baseDir)) continue;
                string[] appDirs;
                try { appDirs = Directory.GetDirectories(baseDir, "app-*"); }
                catch { continue; }
                if (appDirs == null || appDirs.Length == 0) continue;
                Array.Sort(appDirs);
                var res = Path.Combine(appDirs[appDirs.Length - 1], "resources");
                if (!Directory.Exists(res)) continue;
                result.Add(new DiscordInstall
                {
                    Name          = names[i],
                    ResourcesPath = res,
                    IsPatched     = File.Exists(Path.Combine(res, ASAR)),
                    DisplayPath   = baseDir,
                });
            }
            catch { }
        }
        return result;
    }

    public static string DiscordLocalPath(string folderName)
    {
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrEmpty(local))
        {
            var profile = Environment.GetEnvironmentVariable("USERPROFILE");
            if (!string.IsNullOrEmpty(profile))
                local = Path.Combine(profile, "AppData", "Local");
        }
        return string.IsNullOrEmpty(local) ? null : Path.Combine(local, folderName);
    }

    public static string ResolveResourcesPath(string baseDir)
    {
        if (string.IsNullOrEmpty(baseDir) || !Directory.Exists(baseDir)) return null;
        string[] appDirs;
        try { appDirs = Directory.GetDirectories(baseDir, "app-*"); }
        catch { return null; }
        if (appDirs == null || appDirs.Length == 0) return null;
        Array.Sort(appDirs);
        var res = Path.Combine(appDirs[appDirs.Length - 1], "resources");
        return Directory.Exists(res) ? res : null;
    }

    public static string LatestTag()
    {
        try
        {
            using (var wc = MakeClient())
            {
                var json = wc.DownloadString(RELEASE_API);
                var m    = Regex.Match(json, "\"tag_name\"\\s*:\\s*\"([^\"]+)\"");
                return m.Success ? m.Groups[1].Value : "—";
            }
        }
        catch { return "—"; }
    }

    public static string LocalVersion()
    {
        if (!IsInstalled) return "—";
        try { return File.GetLastWriteTime(AsarTarget).ToString("yyyy-MM-dd"); }
        catch { return "Installed"; }
    }

    static string ExeDirectory()
    {
        var loc = Assembly.GetExecutingAssembly().Location;
        if (!string.IsNullOrEmpty(loc)) return Path.GetDirectoryName(loc);
        return AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
    }

    static string BundledDesktopAsarPath()
    {
        try
        {
            var path = Path.GetFullPath(Path.Combine(ExeDirectory(), "..", "dist", ASAR));
            return File.Exists(path) ? path : null;
        }
        catch { return null; }
    }

    static string BundledOpenAsarPath()
    {
        try
        {
            var path = Path.GetFullPath(Path.Combine(ExeDirectory(), "app.asar"));
            return File.Exists(path) ? path : null;
        }
        catch { return null; }
    }

    static string GetAsarUrl(out string tag, out long size, out string checksumUrl)
    {
        tag = ""; size = 0; checksumUrl = "";
        using (var wc = MakeClient())
        {
            var json = wc.DownloadString(RELEASE_API);
            var tm   = Regex.Match(json, "\"tag_name\"\\s*:\\s*\"([^\"]+)\"");
            if (tm.Success) tag = tm.Groups[1].Value;
            var am = Regex.Match(json, "\"assets\"\\s*:\\s*\\[([\\s\\S]+?)\\]");
            if (!am.Success) return null;
            string asarUrl = null;
            foreach (Match bm in Regex.Matches(am.Groups[1].Value, "\\{[^{}]+\\}"))
            {
                var nm = Regex.Match(bm.Value, "\"name\"\\s*:\\s*\"([^\"]+)\"");
                if (!nm.Success) continue;
                var um = Regex.Match(bm.Value, "\"browser_download_url\"\\s*:\\s*\"([^\"]+)\"");
                if (!um.Success) continue;
                var assetName = nm.Groups[1].Value;
                if (assetName == ASAR)
                {
                    var sm = Regex.Match(bm.Value, "\"size\"\\s*:\\s*(\\d+)");
                    if (sm.Success) long.TryParse(sm.Groups[1].Value, out size);
                    asarUrl = um.Groups[1].Value;
                }
                else if (assetName == CHECKSUMS)
                {
                    checksumUrl = um.Groups[1].Value;
                }
            }
            return asarUrl;
        }
    }

    static bool TryDownloadRemoteAsar(string dest, Action<string> status, Action<int> progress,
        out string tag, out long size, out string checksumUrl)
    {
        tag = ""; size = 0; checksumUrl = "";
        try
        {
            var url = GetAsarUrl(out tag, out size, out checksumUrl);
            if (string.IsNullOrEmpty(url)) return false;
            ValidateDownloadUrl(url);
            status(string.Format("Downloading {0}  ({1:F1} MB)...", tag, size / 1048576.0));
            progress(10);
            Download(url, dest, (pct, dl, tot) =>
            {
                status(string.Format("Downloading: {0:F1}/{1:F1} MB  ({2}%)",
                    dl / 1048576.0, tot / 1048576.0, pct));
                progress(10 + (int)(pct * 0.60));
            });
            return true;
        }
        catch { return false; }
    }

    static void Download(string url, string dest, Action<int, long, long> onProgress)
    {
        var req = (HttpWebRequest)WebRequest.Create(url);
        req.UserAgent       = UA;
        req.AllowAutoRedirect = true;
        req.Timeout           = 60000;
        using (var resp = (HttpWebResponse)req.GetResponse())
        using (var rs   = resp.GetResponseStream())
        using (var fs   = File.Create(dest))
        {
            long total = resp.ContentLength, done = 0;
            var  buf   = new byte[81920];
            int  n;
            while ((n = rs.Read(buf, 0, buf.Length)) > 0)
            {
                fs.Write(buf, 0, n);
                done += n;
                if (total > 0 && onProgress != null)
                    onProgress((int)(done * 100 / total), done, total);
            }
        }
    }

    static void ValidateDownloadUrl(string url)
    {
        Uri uri;
        if (!Uri.TryCreate(url, UriKind.Absolute, out uri))
            throw new Exception("Invalid URL");
        if (uri.Scheme != "https")
            throw new Exception("Only HTTPS is allowed");
        if (!uri.Host.EndsWith("github.com", StringComparison.OrdinalIgnoreCase) &&
            !uri.Host.EndsWith("objects.githubusercontent.com", StringComparison.OrdinalIgnoreCase))
            throw new Exception("Untrusted download source: " + uri.Host);
    }

    static string ComputeSha256(string path)
    {
        using (var sha = SHA256.Create())
        using (var fs  = File.OpenRead(path))
        {
            var hash = sha.ComputeHash(fs);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    }

    static string FetchExpectedHash(string checksumUrl, string filename)
    {
        if (string.IsNullOrEmpty(checksumUrl)) return null;
        try
        {
            ValidateDownloadUrl(checksumUrl);
            using (var wc = MakeClient())
            {
                var text = wc.DownloadString(checksumUrl);
                foreach (var line in text.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = line.Trim().Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 2)
                    {
                        var name = parts[parts.Length - 1].TrimStart('*');
                        if (string.Equals(name, filename, StringComparison.OrdinalIgnoreCase))
                            return parts[0].ToLower();
                    }
                }
            }
        }
        catch { }
        return null;
    }

    public static void KillDiscord(string resourcesPath)
    {
        try
        {
            var discordRoot = Path.GetDirectoryName(Path.GetDirectoryName(resourcesPath));
            if (string.IsNullOrEmpty(discordRoot)) return;
            var procName = Path.GetFileName(discordRoot);
            if (string.IsNullOrEmpty(procName)) return;
            foreach (var p in Process.GetProcessesByName(procName))
                try { p.Kill(); p.WaitForExit(3000); } catch { }
            Thread.Sleep(800);
        }
        catch { }
    }

    public static void Install(string res, Action<string> status, Action<int> progress)
    {
        status("Fetching latest release info...");
        progress(5);
        Directory.CreateDirectory(DataDir);
        var tmp = Path.Combine(Path.GetTempPath(),
            "nun_" + Guid.NewGuid().ToString("N") + ".asar");

        string tag, checksumUrl;
        long sz;
        var useRemote = TryDownloadRemoteAsar(tmp, status, progress, out tag, out sz, out checksumUrl);

        if (useRemote)
        {
            status("Verifying file integrity...");
            progress(75);
            var expectedHash = FetchExpectedHash(checksumUrl, ASAR);
            if (!string.IsNullOrEmpty(expectedHash))
            {
                var actualHash = ComputeSha256(tmp);
                if (!string.Equals(expectedHash, actualHash, StringComparison.OrdinalIgnoreCase))
                {
                    try { File.Delete(tmp); } catch { }
                    useRemote = false;
                }
            }
        }

        if (!useRemote)
        {
            var bundled = BundledDesktopAsarPath();
            if (string.IsNullOrEmpty(bundled))
                throw new Exception("Could not find " + ASAR + " online or at dist/" + ASAR);
            status("Using bundled " + ASAR + "...");
            progress(70);
            File.Copy(bundled, tmp, true);
        }

        status("Patching Discord...");
        progress(82);
        KillDiscord(res);
        File.Copy(tmp, Path.Combine(res, ASAR), true);
        File.Copy(tmp, AsarTarget, true);
        try { File.Delete(tmp); } catch { }
        progress(100);
        status("Installed — restart Discord to enable Nun");
    }

    public static void Uninstall(string res, Action<string> status, Action<int> progress)
    {
        status("Removing Nun...");
        progress(20);
        KillDiscord(res);
        progress(50);
        var f = Path.Combine(res, ASAR);
        if (File.Exists(f)) File.Delete(f);
        progress(80);
        if (File.Exists(AsarTarget)) File.Delete(AsarTarget);
        progress(100);
        status("Uninstalled — restart Discord");
    }

    public static void InstallOpenAsar(string res, Action<string> status, Action<int> progress)
    {
        status("Closing Discord...");
        progress(5);
        KillDiscord(res);
        var tmp = Path.Combine(Path.GetTempPath(),
            "openasar_" + Guid.NewGuid().ToString("N") + ".asar");
        var useRemote = false;
        try
        {
            status("Downloading OpenAsar...");
            progress(10);
            ValidateDownloadUrl(OPENASAR_URL);
            Download(OPENASAR_URL, tmp, (p, dl, tot) => progress(10 + (int)(p * 0.85)));
            useRemote = true;
        }
        catch { useRemote = false; }

        if (!useRemote)
        {
            var bundled = BundledOpenAsarPath();
            if (string.IsNullOrEmpty(bundled))
                throw new Exception("Could not download OpenAsar and no bundled app.asar found");
            status("Using bundled OpenAsar...");
            progress(85);
            File.Copy(bundled, tmp, true);
        }

        status("Applying OpenAsar...");
        progress(97);
        File.Copy(tmp, Path.Combine(res, "app.asar"), true);
        try { File.Delete(tmp); } catch { }
        progress(100);
        status("OpenAsar installed — restart Discord");
    }

    static WebClient MakeClient()
    {
        var wc = new WebClient();
        wc.Headers[HttpRequestHeader.UserAgent] = UA;
        return wc;
    }
}

// ─────────────────────────────────────────────────────────────────────
// InstallerForm — sidebar layout  1050 × 650  (borderless)
//
// Crash-safe rules enforced throughout:
//   • NO GraphicsPath inside any Paint/OnPaint — zero risk of GDI null-brush crash
//   • NO Color.Transparent on Panel or Button — only safe on Label/LinkLabel
//   • Card borders via nested panels (outer=border color, inner=surface)
//   • Progress via resizing Panel, not custom control
//   • All cross-thread updates through SafeInvoke — no Application.DoEvents
//   • _suppressEvents guards card-click cascade
//
// Layout (ClientSize 1050 × 650):
//   Sidebar  0,0   240 × 650
//   Main   240,0   810 × 650
//     Close btn  top-right of main
//     HomeCanvas   y=40
//     AboutCanvas  y=40
// ─────────────────────────────────────────────────────────────────────

sealed class InstallerForm : Form
{
    // ── Palette ───────────────────────────────────────────────────────
    static readonly Color BG         = Color.FromArgb( 15,  19,  29);
    static readonly Color SIDEBAR    = Color.FromArgb( 22,  25,  37);
    static readonly Color CARD       = Color.FromArgb( 29,  35,  51);
    static readonly Color CARD_B     = Color.FromArgb( 45,  52,  70);
    static readonly Color ACCENT     = Color.FromArgb(109,  68, 246);
    static readonly Color SUCCESS    = Color.FromArgb( 46, 164,  79);
    static readonly Color BLUE       = Color.FromArgb( 88, 101, 242);
    static readonly Color DANGER     = Color.FromArgb(215,  58,  73);
    static readonly Color SLATE      = Color.FromArgb( 40,  45,  55);
    static readonly Color BORDER_DIM = Color.FromArgb( 50,  55,  70);
    static readonly Color TEXT_PRI   = Color.FromArgb(245, 245, 247);
    static readonly Color TEXT_SEC   = Color.FromArgb(150, 160, 180);
    static readonly Color TEXT_MUTED = Color.FromArgb(100, 110, 130);

    const string GITHUB_URL  = "https://github.com/o9ll/nun";
    const string VER         = "DevBuild";

    // Borderless-window drag
    [DllImport("user32.dll")] static extern int  SendMessage(IntPtr h, int m, int w, int l);
    [DllImport("user32.dll")] static extern bool ReleaseCapture();
    const int WM_NCLBUTTONDOWN = 0xA1;
    const int HT_CAPTION       = 0x2;

    // Controls
    Button  _btnNavHome, _btnNavAbout;
    Panel   _homeCanvas, _aboutCanvas;
    Label   _lblFileStatus, _lblStatus;
    Panel   _progFill;
    Button  _btnInstall, _btnRepair, _btnRemove, _btnOpenAsar;
    Panel   _sidebarPanel, _mainAreaPanel;

    // Discord picker
    ComboBox _cmbDiscord;
    Label    _lblDiscordPath;

    public InstallerForm()
    {
        SuspendLayout();
        SetupWindow();
        BuildSidebar();
        BuildMainArea();
        Shown += OnShown;
        ResumeLayout(true);
    }

    // ── Window ───────────────────────────────────────────────────────

    // Forces taskbar button on borderless windows (WS_EX_APPWINDOW)
    protected override CreateParams CreateParams
    {
        get
        {
            const int WS_EX_APPWINDOW = 0x00040000;
            CreateParams cp = base.CreateParams;
            cp.ExStyle |= WS_EX_APPWINDOW;
            return cp;
        }
    }

    void SetupWindow()
    {
        Text            = "Nun";
        ClientSize      = new Size(1050, 650);
        BackColor       = BG;
        StartPosition   = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar   = true;
        Font            = new Font("Segoe UI", 10f);
        RightToLeft       = RightToLeft.No;
        RightToLeftLayout = false;

        // Load icon from the EXE's own embedded Win32 resources (no external file needed)
        try
        {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        }
        catch
        {
            try
            {
                var ico = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico");
                if (File.Exists(ico)) Icon = new Icon(ico);
            }
            catch { }
        }
    }

    // ── Sidebar (0,0,240,650) ────────────────────────────────────────

    void BuildSidebar()
    {
        var sb = MakePanel(0, 0, 240, 650, SIDEBAR);
        _sidebarPanel = sb;
        Controls.Add(sb);
        sb.MouseDown += OnDrag;

        // Logo
        sb.Controls.Add(MakeLabel("Nun", 22, 30, TEXT_PRI, 20f, FontStyle.Bold, sb));

        // Version badge
        var ver = new Label
        {
            Text      = "v" + VER,
            Location  = new Point(135, 43),
            Size      = new Size(74, 20),
            ForeColor = TEXT_MUTED,
            BackColor = Color.FromArgb(35, 40, 55),
            Font      = new Font("Segoe UI", 8f, FontStyle.Bold),
            TextAlign = ContentAlignment.MiddleCenter,
        };
        sb.Controls.Add(ver);

        // Separator
        sb.Controls.Add(MakePanel(20, 80, 200, 1, Color.FromArgb(35, 40, 55)));

        // Nav buttons
        _btnNavHome  = MakeSidebarBtn("🏠  Home", 100, sb);
        _btnNavAbout = MakeSidebarBtn("ℹ  About", 150, sb);
        _btnNavHome.Click  += (s, e) => SwitchTab(true);
        _btnNavAbout.Click += (s, e) => SwitchTab(false);
        SetNavActive(_btnNavHome);

        // Security card
        var secOuter = MakePanel(20, 450, 200, 132, Color.FromArgb(38, 43, 60));
        sb.Controls.Add(secOuter);
        var secInner = MakePanel(1, 1, 198, 130, Color.FromArgb(28, 32, 48));
        secOuter.Controls.Add(secInner);

        secInner.Controls.Add(MakeLabel("🛡", 82, 10, ACCENT, 16f, FontStyle.Regular, secInner));
        secInner.Controls.Add(MakeLabel("Security",
            10, 40, TEXT_PRI, 10f, FontStyle.Bold, secInner, 178, 22, ContentAlignment.MiddleCenter));
        secInner.Controls.Add(MakeLabel(
            "Nun is built with security and privacy\nin mind for a safe, stable experience.",
            10, 66, TEXT_SEC, 8f, FontStyle.Regular, secInner, 178, 36, ContentAlignment.MiddleCenter));

        var badge = new Label
        {
            Text      = "Verified",
            Location  = new Point(10, 106),
            Size      = new Size(178, 20),
            ForeColor = SUCCESS,
            BackColor = Color.FromArgb(20, 40, 30),
            Font      = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            TextAlign = ContentAlignment.MiddleCenter,
        };
        secInner.Controls.Add(badge);

        // Bottom socials — GitHub • Discord (centered in 240px sidebar)
        sb.Controls.Add(MakePanel(20, 600, 200, 1, Color.FromArgb(35, 40, 55)));
        sb.Controls.Add(MakeLink("GitHub", 60, 615, 8.5f, sb, GITHUB_URL));
    }

    Button MakeSidebarBtn(string text, int y, Panel parent)
    {
        var b = new Button
        {
            Text      = text,
            Location  = new Point(10, y),
            Size      = new Size(220, 40),
            FlatStyle = FlatStyle.Flat,
            ForeColor = TEXT_SEC,
            BackColor = SIDEBAR,
            Font      = new Font("Segoe UI", 10f),
            TextAlign = ContentAlignment.MiddleLeft,
            Padding   = new Padding(12, 0, 0, 0),
        };
        b.FlatAppearance.BorderSize             = 0;
        b.FlatAppearance.MouseOverBackColor     = Color.FromArgb(35, 40, 55);
        b.UseVisualStyleBackColor               = false;
        parent.Controls.Add(b);
        return b;
    }

    void SetNavActive(Button active)
    {
        var all = new[] { _btnNavHome, _btnNavAbout };
        foreach (var b in all)
        {
            if (b == null) continue;
            bool on = (b == active);
            b.BackColor = on ? ACCENT : SIDEBAR;
            b.ForeColor = on ? TEXT_PRI : TEXT_SEC;
        }
    }

    // ── Main area (240,0,810,650) ────────────────────────────────────

    void BuildMainArea()
    {
        var main = MakePanel(240, 0, 810, 650, BG);
        _mainAreaPanel = main;
        Controls.Add(main);
        main.MouseDown += OnDrag;

        // ── Close button ──────────────────────────────────
        var btnClose = MakeFlatBtn("✕", 770, 10, 32, 28, BG, TEXT_MUTED);
        btnClose.FlatAppearance.MouseOverBackColor = DANGER;
        btnClose.Click += (s, e) => Application.Exit();
        main.Controls.Add(btnClose);

        _homeCanvas  = BuildHomeCanvas();
        _aboutCanvas = BuildAboutCanvas();
        main.Controls.Add(_homeCanvas);
        main.Controls.Add(_aboutCanvas);
        _homeCanvas.Visible  = true;
        _aboutCanvas.Visible = false;
    }

    // ── Home canvas (0,40,810,600) ───────────────────────────────────

    Panel BuildHomeCanvas()
    {
        var c = MakePanel(0, 40, 810, 600, BG);
        c.MouseDown += OnDrag;

        // Title + subtitle
        c.Controls.Add(MakeLabel("Nun", 40, 14, TEXT_PRI, 26f, FontStyle.Bold, c));
        c.Controls.Add(MakeLabel("Advanced installer for o9ll/nun",
            46, 60, TEXT_SEC, 11f, FontStyle.Regular, c));

        // ── Path card (y=95) ──────────────────────────
        var pathOuter = MakePanel(40, 95, 730, 90, CARD_B);
        c.Controls.Add(pathOuter);
        var pathInner = MakePanel(1, 1, 728, 88, CARD);
        pathOuter.Controls.Add(pathInner);

        pathInner.Controls.Add(MakeLabel("Install File", 572, 12, TEXT_PRI, 10.5f, FontStyle.Bold, pathInner));
        var btnOpen = MakeFlatBtn("Open Folder", 12, 10, 130, 34, ACCENT, TEXT_PRI);
        btnOpen.Click += (s, e) =>
        {
            try { Directory.CreateDirectory(Logic.DataDir); Process.Start("explorer.exe", Logic.DataDir); }
            catch { }
        };
        pathInner.Controls.Add(btnOpen);

        pathInner.Controls.Add(MakeLabel(ShortenPath(Logic.AsarTarget),
            16, 52, Color.FromArgb(180, 190, 210), 9f, FontStyle.Regular, pathInner, 560, 18));
        _lblFileStatus = MakeLabel("Checking...", 505, 68, TEXT_MUTED, 9f, FontStyle.Bold, pathInner, 152, 18, ContentAlignment.TopRight);
        pathInner.Controls.Add(_lblFileStatus);

        // ── Discord selection (y=200) ─────────────────
        c.Controls.Add(MakeLabel("Select Discord to modify",
            40, 200, TEXT_PRI, 10.5f, FontStyle.Bold, c));
        BuildDiscordSelector(c);

        // ── Progress track (y=300) ────────────────────
        var progTrack = MakePanel(40, 300, 730, 4, Color.FromArgb(34, 36, 42));
        c.Controls.Add(progTrack);
        _progFill = MakePanel(0, 0, 0, 4, SUCCESS);
        progTrack.Controls.Add(_progFill);

        _lblStatus = new Label
        {
            Text      = "Ready — select a Discord version then press Install",
            Location  = new Point(40, 308),
            Size      = new Size(730, 20),
            ForeColor = TEXT_MUTED,
            BackColor = BG,
            Font      = new Font("Segoe UI", 9f),
        };
        c.Controls.Add(_lblStatus);

        // ── 4 action buttons (y=530) ──────────────────
        // No emoji in buttons — GDI (.NET 4.0) cannot render supplementary-plane characters
        _btnInstall  = MakeFlatBtn("Install",          40,  514, 170, 46, SUCCESS, Color.White);
        _btnRepair   = MakeFlatBtn("Repair",           220,  514, 195, 46, BLUE,    Color.White);
        _btnRemove   = MakeFlatBtn("Uninstall",        425,  514, 170, 46, DANGER,  Color.White);
        _btnOpenAsar = MakeFlatBtn("Install OpenAsar", 605,  514, 165, 46, SLATE,   Color.White);

        foreach (var b in new[] { _btnInstall, _btnRepair, _btnRemove, _btnOpenAsar })
            b.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);

        _btnInstall.Click  += OnInstall;
        _btnRepair.Click   += OnRepair;
        _btnRemove.Click   += OnRemove;
        _btnOpenAsar.Click += OnOpenAsar;

        c.Controls.Add(_btnInstall);
        c.Controls.Add(_btnRepair);
        c.Controls.Add(_btnRemove);
        c.Controls.Add(_btnOpenAsar);

        // ── Footer strip (must end at exactly y=600 — canvas height limit) ──
        var ftSep = MakePanel(0, 577, 810, 1, BORDER_DIM);
        c.Controls.Add(ftSep);

        var ft = MakePanel(0, 578, 810, 22, SIDEBAR);
        c.Controls.Add(ft);

        ft.Controls.Add(MakeLink("Nun  ↗", 14, 3, 8.5f, ft, GITHUB_URL));
        ft.Controls.Add(MakeLabel("© Nun • License under GPL-3", 220, 3, TEXT_MUTED, 8.5f, FontStyle.Regular, ft, 574, 18, ContentAlignment.TopRight));

        return c;
    }

    void BuildDiscordSelector(Panel c)
    {
        var channels = new[]
        {
            new { Label = "Discord",        Folder = "Discord" },
            new { Label = "Discord Canary", Folder = "DiscordCanary" },
            new { Label = "Discord PTB",    Folder = "DiscordPTB" },
        };

        _cmbDiscord = new ComboBox
        {
            Location      = new Point(40, 228),
            Size          = new Size(730, 28),
            DropDownStyle = ComboBoxStyle.DropDownList,
            BackColor     = Color.FromArgb(35, 40, 55),
            ForeColor     = TEXT_PRI,
            Font          = new Font("Segoe UI", 9.5f),
            FlatStyle     = FlatStyle.Flat,
            RightToLeft   = RightToLeft.No,
        };

        int firstAvailable = -1;
        foreach (var ch in channels)
        {
            var basePath = Logic.DiscordLocalPath(ch.Folder);
            var res      = Logic.ResolveResourcesPath(basePath);
            var exists   = !string.IsNullOrEmpty(basePath) && Directory.Exists(basePath);
            var item = new DiscordComboItem
            {
                Label         = ch.Label,
                BasePath      = basePath ?? Logic.DiscordLocalPath(ch.Folder) ?? ch.Folder,
                ResourcesPath = res,
                IsInstalled   = exists && res != null,
                IsPatched     = res != null && File.Exists(Path.Combine(res, "desktop.asar")),
            };
            _cmbDiscord.Items.Add(item);
            if (firstAvailable < 0 && item.IsInstalled)
                firstAvailable = _cmbDiscord.Items.Count - 1;
        }

        _cmbDiscord.SelectedIndex = firstAvailable >= 0 ? firstAvailable : 0;
        _cmbDiscord.SelectedIndexChanged += (s, e) => UpdateDiscordPathLabel();
        c.Controls.Add(_cmbDiscord);

        _lblDiscordPath = MakeLabel("", 40, 266, TEXT_MUTED, 9f, FontStyle.Regular, c, 730, 18);
        UpdateDiscordPathLabel();
    }

    void UpdateDiscordPathLabel()
    {
        if (_lblDiscordPath == null) return;
        var item = GetSelectedDiscordItem();
        if (item == null)
        {
            _lblDiscordPath.Text      = "";
            _lblDiscordPath.ForeColor = TEXT_MUTED;
            return;
        }
        if (item.IsInstalled)
        {
            _lblDiscordPath.Text      = "Resources: " + ShortenPath(item.ResourcesPath);
            _lblDiscordPath.ForeColor = item.IsPatched ? SUCCESS : TEXT_SEC;
        }
        else
        {
            _lblDiscordPath.Text      = "Not installed at " + item.BasePath;
            _lblDiscordPath.ForeColor = DANGER;
        }
        UpdatePrimaryButton();
    }

    DiscordComboItem GetSelectedDiscordItem()
    {
        if (_cmbDiscord == null || _cmbDiscord.SelectedItem == null) return null;
        return _cmbDiscord.SelectedItem as DiscordComboItem;
    }

    // ── About canvas ─────────────────────────────────────────────────

    Panel BuildAboutCanvas()
    {
        var c = MakePanel(0, 40, 810, 600, BG);

        c.Controls.Add(MakeLabel("About", 40, 14, TEXT_PRI, 24f, FontStyle.Bold, c));

        // Info card
        var infoO = MakePanel(40, 70, 730, 150, CARD_B);
        c.Controls.Add(infoO);
        var infoI = MakePanel(1, 1, 728, 148, CARD);
        infoO.Controls.Add(infoI);

        infoI.Controls.Add(MakeLabel("Package & Version Info", 518, 14, ACCENT, 11f, FontStyle.Bold, infoI));
        infoI.Controls.Add(MakeLabel(
            "•  Installer version: v" + VER + "\n" +
            "•  Runtime: .NET Framework 4.0 — WinForms\n" +
            "•  Compatibility: Windows 10/11 x64 including LTSC\n" +
            "•  Secure design: no custom GDI or OnPaint overrides",
            16, 42, TEXT_SEC, 9.5f, FontStyle.Regular, infoI, 620, 90));

        // Team card — expanded to fit full roster
        var teamO = MakePanel(40, 240, 730, 222, CARD_B);
        c.Controls.Add(teamO);
        var teamI = MakePanel(1, 1, 728, 220, CARD);
        teamO.Controls.Add(teamI);

        teamI.Controls.Add(MakeLabel("Development Team", 16, 14, SUCCESS, 11f, FontStyle.Bold, teamI));

        int rowY = 44;
        Action<string, string, Color, string> addMember = (name, role, col, icon) =>
        {
            teamI.Controls.Add(MakeLabel(icon, 680, rowY, col, 9f, FontStyle.Bold, teamI));
            teamI.Controls.Add(MakeLabel(name, 620, rowY, TEXT_PRI, 9f, FontStyle.Bold, teamI));
            teamI.Controls.Add(MakeLabel("—  " + role, 10, rowY, TEXT_SEC, 9f, FontStyle.Regular, teamI, 650, 18));
            rowY += 22;
        };

        addMember("o9", "Lead developer — project build & management", ACCENT,   "★");
        addMember("01", "Main supporter — support & development",      SUCCESS,  "◆");
        addMember("02", "Contributor",                                  BLUE,    "●");
        addMember("03", "Contributor",                                  BLUE,    "●");
        addMember("04", "Contributor",                                  BLUE,    "●");
        addMember("05", "Contributor",                                  BLUE,    "●");
        addMember("06", "Contributor",                                  BLUE,    "●");

        teamI.Controls.Add(MakeLink("GitHub  ↗", 16, 200, 9f, teamI, GITHUB_URL));

        // License card
        var licO = MakePanel(40, 480, 730, 50, CARD_B);
        c.Controls.Add(licO);
        var licI = MakePanel(1, 1, 728, 48, CARD);
        licO.Controls.Add(licI);
        licI.Controls.Add(MakeLabel(
            "License: GPL-3.0  ·  Official source only: github.com/o9ll/nun",
            30, 14, TEXT_MUTED, 9f, FontStyle.Regular, licI));

        return c;
    }

    // ── Tab switching ─────────────────────────────────────────────────

    void SwitchTab(bool home)
    {
        _homeCanvas.Visible  = home;
        _aboutCanvas.Visible = !home;
        SetNavActive(home ? _btnNavHome : _btnNavAbout);
    }

    // ── Shown ─────────────────────────────────────────────────────────

    void OnShown(object sender, EventArgs e)
    {
        UpdatePrimaryButton();

        bool inst = Logic.IsInstalled;
        if (_lblFileStatus != null)
        {
            _lblFileStatus.Text      = inst ? "File verified successfully" : "Not installed yet";
            _lblFileStatus.ForeColor = inst ? SUCCESS : TEXT_MUTED;
        }
    }

    // ── State-aware primary button ────────────────────────────────────

    void UpdatePrimaryButton()
    {
        if (_btnInstall == null) return;
        if (Logic.IsInstalled)
        {
            _btnInstall.Text      = "Update Nun  ↑";
            _btnInstall.BackColor = BLUE;
            _btnInstall.FlatAppearance.MouseOverBackColor = Color.FromArgb(110, 120, 250);
        }
        else
        {
            _btnInstall.Text      = "Install  ✓";
            _btnInstall.BackColor = SUCCESS;
            _btnInstall.FlatAppearance.MouseOverBackColor = Color.FromArgb(68, 185, 100);
        }
    }

    // ── Target resolution ─────────────────────────────────────────────

    bool TryGetTarget(out string path)
    {
        path = null;
        try
        {
            var item = GetSelectedDiscordItem();
            if (item == null || string.IsNullOrEmpty(item.ResourcesPath))
                throw new Exception("Discord not found at the selected location — install Discord first");
            path = item.ResourcesPath;
            return true;
        }
        catch (Exception ex) { Msg("✖ " + ex.Message); return false; }
    }

    bool ConfirmKill(string res)
    {
        try
        {
            var root = Path.GetDirectoryName(Path.GetDirectoryName(res));
            if (string.IsNullOrEmpty(root)) return true;
            var name = Path.GetFileName(root);
            if (string.IsNullOrEmpty(name)) return true;
            if (Process.GetProcessesByName(name).Length == 0) return true;
            return MessageBox.Show(this,
                "Discord is running and will be closed.\nDo you want to continue?",
                "Warning",
                MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes;
        }
        catch { return true; }
    }

    // ── Button handlers ───────────────────────────────────────────────

    void OnInstall(object sender, EventArgs e)
    {
        string t; if (!TryGetTarget(out t) || !ConfirmKill(t)) return;
        RunAsync(() => Logic.Install(t, s => Msg(s), v => Prog(v)));
    }

    void OnRepair(object sender, EventArgs e)
    {
        string t; if (!TryGetTarget(out t) || !ConfirmKill(t)) return;
        RunAsync(() => Logic.Install(t, s => Msg(s), v => Prog(v)));
    }

    void OnRemove(object sender, EventArgs e)
    {
        string t; if (!TryGetTarget(out t)) return;
        if (MessageBox.Show(this,
                "Are you sure you want to completely uninstall Nun?",
                "Confirm",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        if (!ConfirmKill(t)) return;
        RunAsync(() => Logic.Uninstall(t, s => Msg(s), v => Prog(v)));
    }

    void OnOpenAsar(object sender, EventArgs e)
    {
        string t; if (!TryGetTarget(out t) || !ConfirmKill(t)) return;
        RunAsync(() => Logic.InstallOpenAsar(t, s => Msg(s), v => Prog(v)));
    }

    // ── Async runner ──────────────────────────────────────────────────

    void RunAsync(Action op)
    {
        SetBusy(true); Prog(0);
        var t = new Thread(() =>
        {
            try { op(); }
            catch (Exception ex) { Msg("Error: " + ex.Message); Prog(0); }
            finally
            {
                if (!IsDisposed) SafeInvoke(() =>
                {
                    SetBusy(false);
                    UpdatePrimaryButton();
                    bool inst = Logic.IsInstalled;
                    if (_lblFileStatus != null)
                    {
                        _lblFileStatus.Text      = inst ? "File verified successfully" : "Not installed yet";
                        _lblFileStatus.ForeColor = inst ? SUCCESS : TEXT_MUTED;
                    }
                });
            }
        });
        t.IsBackground = true;
        t.Start();
    }

    void Msg(string text)  { SafeInvoke(() => { if (_lblStatus != null) _lblStatus.Text = text; }); }

    void Prog(int v)
    {
        SafeInvoke(() =>
        {
            int w = (int)(730 * Math.Max(0, Math.Min(100, v)) / 100.0);
            if (_progFill != null) _progFill.Width = w;
        });
    }

    void SetBusy(bool on)
    {
        foreach (var b in new[] { _btnInstall, _btnRepair, _btnRemove, _btnOpenAsar })
            if (b != null) b.Enabled = !on;
        if (_cmbDiscord != null) _cmbDiscord.Enabled = !on;
        UseWaitCursor = on;
    }

    void OnDrag(object sender, MouseEventArgs e)
    {
        if (e.Button == MouseButtons.Left) { ReleaseCapture(); SendMessage(Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0); }
    }

    void SafeInvoke(Action a)
    {
        if (IsDisposed) return;
        try { if (InvokeRequired) Invoke(a); else a(); }
        catch { }
    }

    static string ShortenPath(string path)
    {
        try
        {
            var roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (!string.IsNullOrEmpty(roaming) &&
                path.StartsWith(roaming, StringComparison.OrdinalIgnoreCase))
                return "Roaming" + path.Substring(roaming.Length);
        }
        catch { }
        return path.Length > 70 ? "..." + path.Substring(path.Length - 67) : path;
    }

    static void TryOpen(string url)
    {
        if (string.IsNullOrEmpty(url)) return;
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch { }
    }

    // ── Control factories ─────────────────────────────────────────────
    // Panel/Button: always explicit solid BackColor — NEVER Color.Transparent
    // Label/LinkLabel: Color.Transparent is safe (they use parent BackColor via WM_ERASEBKGND)

    static Panel MakePanel(int x, int y, int w, int h, Color bg)
    {
        return new Panel { Location = new Point(x, y), Size = new Size(w, h), BackColor = bg };
    }

    static Label MakeLabel(string text, int x, int y, Color col,
        float fs = 10f, FontStyle st = FontStyle.Regular,
        Control parent = null, int w = 0, int h = 0,
        ContentAlignment align = ContentAlignment.TopLeft)
    {
        var l = new Label
        {
            Text      = text,
            Location  = new Point(x, y),
            ForeColor = col,
            BackColor = Color.Transparent,
            Font      = new Font("Segoe UI", fs, st),
            TextAlign = align,
        };
        if (w > 0 && h > 0) l.Size = new Size(w, h);
        else l.AutoSize = true;
        if (parent != null) parent.Controls.Add(l);
        return l;
    }

    static Button MakeFlatBtn(string text, int x, int y, int w, int h, Color bg, Color fg)
    {
        var b = new Button
        {
            Text      = text,
            Location  = new Point(x, y),
            Size      = new Size(w, h),
            BackColor = bg,
            ForeColor = fg,
            FlatStyle = FlatStyle.Flat,
            Font      = new Font("Segoe UI", 10f),
            Cursor    = Cursors.Hand,
            UseVisualStyleBackColor = false,
        };
        b.FlatAppearance.BorderSize             = 0;
        b.FlatAppearance.MouseOverBackColor     = ControlPaint.Light(bg, 0.12f);
        return b;
    }

    static LinkLabel MakeLink(string text, int x, int y, float fs, Control parent, string url)
    {
        var l = new LinkLabel
        {
            Text            = text,
            Location        = new Point(x, y),
            AutoSize        = true,
            ForeColor       = Color.FromArgb(114, 118, 125),
            BackColor       = Color.Transparent,
            Font            = new Font("Segoe UI", fs),
            LinkColor       = Color.FromArgb(114, 118, 125),
            ActiveLinkColor = Color.FromArgb(109, 68, 246),
            LinkBehavior    = LinkBehavior.HoverUnderline,
        };
        if (!string.IsNullOrEmpty(url))
            l.LinkClicked += (s, e) => TryOpen(url);
        if (parent != null) parent.Controls.Add(l);
        return l;
    }
}

// ─────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────

static class Program
{
    [DllImport("user32.dll")]
    static extern bool SetProcessDPIAware();

    [STAThread]
    static void Main()
    {
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += (s, ex) =>
        {
            try
            {
                File.WriteAllText(
                    Path.Combine(Path.GetTempPath(), "nun_crash.txt"),
                    string.Format("[{0}] {1}: {2}",
                        DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                        ex.Exception.GetType().Name,
                        ex.Exception.Message));
            }
            catch { }
            MessageBox.Show("Error:\n" + ex.Exception.Message,
                "Nun", MessageBoxButtons.OK, MessageBoxIcon.Error);
        };

        try { SetProcessDPIAware(); } catch { }

        Logic.InitNetwork();
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new InstallerForm());
    }
}
