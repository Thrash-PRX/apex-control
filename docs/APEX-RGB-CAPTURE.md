# Physical APEX RGB capture — 2026-10-31

User confirmed stock MKeyboard RGB works over USB. After restart USBPcap 1.5.4.0 driver was RUNNING. Read-only hub connection IOCTL identified VID314B/PID1026 on USBPcap2, physical port2, USB capture address3. Windows DEVPKEY_Device_Address returned the physical port, not the capture address. An initial address2 descriptor capture identified 048D:C999 and was stopped before any requested RGB change. Do not reuse port numbers as capture addresses.

Private PCAPs and raw readback sections are outside Git under ../outputs/private-captures. Sanitized RGB-only fixtures and capture SHA-256 hashes are retained in research/evidence/apex-red-green-fixtures.json. No user keyboard-input reports, device paths, machine identifiers, or full configurations are committed.

## Established by device traffic

Both correctly scoped captures inject a device descriptor identifying 314B:1026. All retained FA configuration packets are 64 bytes; no HIDAPI report-ID prefix is present in captured report data. This resolves the 128-byte static program default for this observed session, not every firmware/device.

User changed solid color to red and confirmed a subsequent pure-green change visibly worked. In both captures, output is `FA 13 01 01 00 08 01 64 32 00 0D R G B`, padded to 64 bytes. Red RGB is FF 00 00; final green RGB is 00 FF 00. Green capture also contains one intermediate picker color AA FF 7F. First five payload bytes stay unchanged. Their semantics are NOT inferred from one unchanged setting; no brightness/speed/mode mapping is claimed.

Response is command93, frame1/total1, payload length1, payload00. Bytes after that payload repeat prior request values but are padding/undefined, NOT a second payload. A zero response byte was observed; broader success/error semantics remain unknown. Startup getter traffic also matches request opcode OR80 for this session. Do not assume opcode echo.

Captured startup transactions include 16->96 (6 host-requested pages), 18->98 (4 pages), 2A->AA (two 5-page transactions), 2B->AB (11 pages), 2C->AC (12 pages), 42->C2 (ten single-page transactions), 57->D7 and 5E->DE (one page each). Some requests have one-byte payloads; 16/2B/2C/57/5E have zero-length payloads in this capture. Product-info62 carries7 bytes and is excluded from backup exports because side effects remain unknown. Command19 was also observed but is not reclassified as harmless.

## Delivered software

Offline PCAP parser validates framing and filters an explicit USB address. Captured-section exporter matches host requests to responses, validates ordered pages, retains raw request/response bytes and hashes complete sections. Private export contains19 complete transactions and no incomplete commands. This is NOT a complete device backup, a restore test, or authorization to write. Single-page macro reads can refer to distinct indexed entities; do not collapse them.

Offline typed effect encoder matches captured red/green packets byte-for-byte; response parser respects the declared one-byte payload. It has no transport integration. Tests cover capture filtering/truncation, captured fixtures, request/response matching and incomplete-section exclusion.

## Remaining gates

No APEX CONTROL configuration write has occurred. All physical output/feature writes remain locked under the user's original constraint. Next evidence needed: independently vary brightness, speed and mode in stock software; establish mode identifiers and raw ranges; map all necessary backup sections and entity indices; validate a restore path before any write-policy change. SOCD/RT scaling and display commands remain unverified. Reference WK68 software cannot establish APEX mode IDs.

Brightness differential: user confirmed100% to50% and visible dimming, with solid green and speed unchanged. Final packet changes only offset7 (second payload byte) from100 to50. One intermediate slider value46 was also captured. Captured configuration traffic uses interrupt OUT endpoint04 and IN endpoint84; no feature-report transport was involved. No values are extrapolated to millimetres or SOCD.

Speed/mode differential: user reported Breath, green,50% brightness,80% speed. Capture instead records [03,64,50,00,0F,00,FF,00] (hex), i.e. mode byte3, brightness byte100 and speed byte80. Two packets differing only at offset8 establish speed100→80. Other changes during the session show color picker updates and an option changing1→0. Solid used prefix [01,64,32,00,0D]; Breath used [03,64,50,00,0F]. Mode switch changed multiple fields, so do not treat first byte as the sole required selector or reuse option/parameter defaults across modes. The brightness50 UI claim versus byte100 discrepancy remains unresolved. Read-only Computer Use access to MKeyboard was denied by the client; no workaround was attempted. All four correctly scoped captures are stopped.

User correction: brightness was actually100 in the final Breath session. This resolves the discrepancy above; final observed settings are Breath/brightness100/speed80/green. No further UI access is needed to reconcile this capture.


Effect-table correction: 17→97 with request payloadFF returns twelve8-byte setting records across2 pages; 18→98 returns name records with payload startIndex/nameWidth18/three padded names per page. Captured IDs0..11 are Close,Static,Layer,Breath,Star,Flow L->R,Flow R->L,Flow Up->Dn,Flow Dn->Up,Dot(Press),Cross(Press),Ripple(Press). Exporter now includes effect settings: actual programmatic count19 complete captured transactions. Earlier manual count17 was incorrect. Raw per-effect settings remain in the private export; only name catalogue and controlled RGB fixtures are committed.
