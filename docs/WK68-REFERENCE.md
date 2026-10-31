# WK68 reference intake — 2026-10-31

Supplied WK68.exe: 2,431,119 bytes; SHA-256 94ae1d82fe135b1957db5fcb97a6ab0593bff74a4f145d1dbcad17d9618dc378.

Static observations: PE32 x86; embedded strings identify Inno Setup Setup Data (5.3.3) (u), SetupLdr, and JR.Inno.Setup. REA resource inspection found 20 resources across 46 entries, including installer icon/version/manifest resources. Evidence: ev_44f61644951c37b192f4ef68763b7bc9318d58c6f23fefcc7fe1985b31bc1e4c.

This is an installer wrapper. Its resource inventory does not establish the packaged application's RGB modes, controls, or device protocol. No RGB mode mapping or compatibility claim can yet be made. No installer/application execution or HID operations occurred. No manufacturer binary or extracted assets were added to Git.

Next step: obtain a trusted Inno extractor and unpack into an isolated local ignored directory without running the installer. Inventory the packaged executable, configuration and language resources; trace the lighting mode list and application controls before implementing WK68-referenced behavior. Existing MKeyboard installation is not presumed to be this application's payload.
