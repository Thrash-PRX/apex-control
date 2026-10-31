# WK68 reference intake — 2026-10-31

Supplied WK68.exe: 2,431,119 bytes; SHA-256 94ae1d82fe135b1957db5fcb97a6ab0593bff74a4f145d1dbcad17d9618dc378.

Static observations: PE32 x86; embedded strings identify Inno Setup Setup Data (5.3.3) (u), SetupLdr, and JR.Inno.Setup. REA resource inspection found 20 resources across 46 entries, including installer icon/version/manifest resources. Evidence: ev_44f61644951c37b192f4ef68763b7bc9318d58c6f23fefcc7fe1985b31bc1e4c.

This is an installer wrapper. Its resource inventory does not establish the packaged application's RGB modes, controls, or device protocol. No RGB mode mapping or compatibility claim can yet be made. No installer/application execution or HID operations occurred. No manufacturer binary or extracted assets were added to Git.

Next step: obtain a trusted Inno extractor and unpack into an isolated local ignored directory without running the installer. Inventory the packaged executable, configuration and language resources; trace the lighting mode list and application controls before implementing WK68-referenced behavior. Existing MKeyboard installation is not presumed to be this application's payload.

## Extracted application and RGB evidence

Unpacked with official innoextract 1.9 portable release, downloaded from https://github.com/dscharrer/innoextract/releases/download/1.9/innoextract-1.9-windows.zip. Extractor executable SHA-256: 946bd06d8b3722a791fea4d84f496139eef6faef61640924cb72f5f1998a68e1. The extractor ran; WK68 installer, OemDrv.exe and packaged DLLs did not run. Private extraction remains outside the repository under ../outputs/wk68-unpacked.

Payload includes OemDrv.exe, three Dev/kb/*/KB.ini profiles, English/Chinese language resources, effect-layout text and skin images. Hashes and exact RGB configuration rows are retained in research/evidence/wk68-rgb-reference.json; manufacturer binaries and images are not committed.

English keyboard resources list Fixed_on, Respire, Rainbow, Flash_away, Raindrops, Rainbow_wheel, Ripples_shining, Stars_twinkle, Shadow_disappear, Retro_snake, Neon_stream, Reaction, Sine_wave, Retinue scanning, Rotating windmill, Colorful waterfall, Blossoming, Rotating storm, Self-define, OFF. Empty labels 21/22 also exist. This is a resource catalogue, not proof all twenty entries appear for each device. LedMask and the blank label referenced by LedOpt19 require application-code tracing before a definitive visible-mode mapping.

All three configuration files expose Light=0,1,2,3,4; LightHW=1,5,10,15,20; Speed=0,1,2,3,4; SpeedHW=0,1,2,3,4. A comment labels LedOpt columns hw/effect/speed/light/direct/random/color. Interpretation remains static configuration evidence. Numeric rows must never be used as APEX opcodes or raw parameter scales.

Profiles 1/2 target wired 258A:019D and wireless 258A:0150; profile 3 targets wired 258A:010C and wireless 3554:FA09. None matches observed APEX 314B:1026. Some profiles describe screen settings, including 128x128; those do not establish APEX panel dimensions. English resources also contain music gain/smoothness and audio mode labels; system-audio capture and behavior have not been observed.

Implemented an independent local preview for the existing APEX lighting effects: whole-board static/brightness, breathing, wave, rainbow, color cycle, gradient, selected-key custom and illustrative reactive/ripple origins, plus off. These are authored previews, not recovered WK68 algorithms. Speed/direction influence the applicable previews; reduced-motion preference disables animation at mount. No transport imports or hardware writes are added. Exact remaining WK68 effects require deeper tracing or an isolated runtime reference; resource names alone do not establish their algorithms.
