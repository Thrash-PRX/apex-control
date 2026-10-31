# Experimental physical custom-animation playback

The user's current request authorizes work on remaining RGB effects. No reset/calibration/firmware/SOCD/RT/display operations are added. Generic transport write methods remain locked.

A dedicated custom playback transaction uses physically captured commands:16→96 palette read,19→99 mode255 selection,10→90 grouped-key coloring. Each output remains64 bytes with report ID0. The existing descriptor check and314B:1026 identity check apply. It saves the full readback before mutations, retains five backup snapshots, and exposes downloadable history. It validates palette page bounds/duplicates and active-index coverage, permits only one in-flight acknowledged packet, times out without automatic retry, restores each active key's raw original record, and compares a complete readback. Stop/unmount abort playback; restoration is attempted while the connection remains usable. If unplugged or the tab closes, restoration may fail or not run; backup history is retained. Custom mode255 remains selected after the test; previous native mode is not known/restored.

Initial test is8 frames at at most2fps, with grouped quantized colors (four levels per channel). It is a deliberately bounded protocol test, not a finished continuous high-frame-rate player. No high-rate EEPROM/RAM persistence claim is made. A successful short test does not prove unlimited repeated writes are appropriate.

Mapping comes from retained vendor database layout DB-STATIC-001 (source hash a98790ed7a8c1d87c9a9316aa82a4de5849d49eed443777a56fd4e57f4d4a0b4), normalized positions and active keyItem values only. Inactive indices14/15 are not written. Physical W34 is capture-confirmed; remaining spatial mappings are static-source-derived, not individually verified. No vendor binaries, device paths or full database rows are copied into the application.

Independent authored effect renderer supplies the colors. Page-focused key events support reactive/shadow/heatmap behavior using a bounded in-memory history, excluding input/textarea/select and editable targets. No system-wide hooks, pressure data or game input is captured. Settings are snapshotted at Start; keep the page open. Native RGB Apply remains available separately.

147 automated tests, lint and production build passed before the live user test. Tests simulate full palette reads, grouped writes, restore/readback and storage failure. Physical animation and restore confirmation are pending. Do not describe reference effects as hardware verified until the user test completes.
