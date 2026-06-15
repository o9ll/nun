# Nun Installer

The Nun Installer patches Discord on Windows to load [Nun](https://github.com/o9ll/nun).

## Usage

See https://github.com/o9ll/nun

## Building from source (Windows)

### Prerequisites

- [Go](https://go.dev/doc/install)
- GCC via [MinGW-w64](https://www.mingw-w64.org/) (or MSYS2 with `mingw-w64-x86_64-gcc`)
- For the GUI build: SDL2 dev libraries (`mingw-w64-x86_64-SDL2` on MSYS2)

### Install dependencies

```sh
go mod tidy
```

### Build the GUI

```sh
go-winres make --product-version "dev"
CGO_ENABLED=1 GOOS=windows GOARCH=amd64 go build -v -tags static -ldflags "-s -w -H=windowsgui"
```

### Build the CLI

```sh
CGO_ENABLED=0 GOOS=windows GOARCH=386 go build -v -tags "static cli" -ldflags "-s -w"
```

See [.github/workflows/build-installer.yml](../.github/workflows/build-installer.yml) for the full release build flags.
