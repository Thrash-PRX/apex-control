# APEX200 physical screen investigation — 2026-11-03

Status: custom image upload not established. This is an evidence blocker, not proof of hardware impossibility.

## Evidence
- User's physical APEX200 shows connection mode, Windows/Mac, battery, Win lock and brand logo. User confirms installed stock MKeyboard has no screen customization option.
- Installed GameKeyboard.exe identity verified by REA: SHA256 8c8375bd4a7cee0c00fc8a0bf18f3618b8b4f9730a611998088c9c893e6f0c7d. Deep provider unavailable (Ghidra/IDA not configured, Hopper unsupported host); no decompilation claimed.
- Installed read-only database/resource scan supplies no image-upload path. Generic translated screen-brightness strings do not establish APEX screen commands. Product database width/height must not be reused as display resolution.
- First-hand teardown: https://www.reddit.com/r/mkindia/comments/1sqqcgz/ant_esports_apex200_unboxing/ describes a removable display cable and reports no software customization. A commenter guesses an XMC main MCU; that is not a verified display-controller identification. Image fetch failed; no marking was visually read.
- First-hand customization question: https://www.reddit.com/r/mkindia/comments/1rkd1la/i_got_myself_an_ant_esports_apex200_hall_effect/ reports fixed status/logo and no stock reprogramming feature.
- Manufacturer product/download listings examined: https://antesports.com/products/apex200-tri-mode-magnetic-keyboard-black and https://antesports.com/pages/downloads . No pixel format, framebuffer command or image-upload specification established.
- Searches for internal HX-84W asset name and 314B:1026 identity found no relevant public screen-controller implementation. Search absence is not proof of nonexistence.

## Remaining unknowns
Panel type (fixed segments vs arbitrary pixels), controller/part number, bus/pinout, host upload capability, firmware permission, dimensions, pixel encoding, transfer framing, acknowledgements and recovery/readback. A logo alone does not prove arbitrary-pixel support or an accessible framebuffer.

## Next evidence required
A legible physical display/module identification or manufacturer controller/protocol documentation. External lit-panel photos may distinguish fixed artwork, but cannot establish an upload protocol. If arbitrary pixels are supported, trace a documented host operation before implementing an encoder; preserve original state and verify restoration. If only fixed segments are available, custom images cannot be implemented by adding web software. No flashing, resets, guessed opcode probes or physical disassembly performed/authorized by this investigation.

Existing Display Studio stays a local design editor. No resolution, panel technology or upload feature should be presented as verified. No application/device behavior changed; tests not applicable to this report.
