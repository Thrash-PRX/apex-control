# Offline USB protocol reconstruction

This is static analysis of the installed `GameKeyboard.exe`, SHA-256 `8c8375bd4a7cee0c00fc8a0bf18f3618b8b4f9730a611998088c9c893e6f0c7d`. No vendor executable or DLL was loaded or executed. No packet in this report was sent to a device. REA established native PE identity; the detailed instruction evidence below comes from **pefile + Capstone**, not a REA decompiler. Native REA decompilation was unavailable because Ghidra/IDA were not configured.

`native-index.json` retains imports and relevant ASCII/UTF-16 strings with original offsets. `hid-callers.asm`, `usb-receivers.asm`, and `usb-support.asm` retain virtual addresses, original file offsets, instruction bytes, and imported API names. `native-commands.json` ties debug-message names to actual `hid_write` callers and opcode stores; a debug name alone does not prove semantics or firmware support.

## Framing: strong static evidence

The normal USB wrappers zero-fill a shared buffer, set byte zero to zero, build a packet, then call the `hid_write` import thunk at VA `0x1400c0327`. The global at VA `0x140194990` is initialized to **128**; USB callers pass this value plus one. This reconstructs a 129-byte HIDAPI buffer, with a report-ID byte plus a 128-byte payload. This is the program's initial setting, not proof that every device/firmware uses this size.

| HIDAPI buffer offset | Value / role |
|---|---|
| 0 | `00`, unnumbered HID report ID |
| 1 | `FA`, vendor magic |
| 2 | command |
| 3 | frame index from object+`5A` |
| 4 | total frame count from object+`59` |
| 5 | zero in inspected outgoing wrappers |
| 6 | payload length |
| 7 onward | command payload |
| remainder | zero padding |

Pagination is corroborated by debug labels `frame`/`total`, chunk calculation `(frame-1)*chunkSize`, and helper stores `0x0101` into object+`59` (e.g. VA `0x1400af375`). No checksum/footer calculation appears between buffer clearing and `hid_write` in the inspected RGB/trigger/RT wrappers. Therefore the offline reconstruction pads with zero and adds no checksum. This bounded observation does not prove all commands or firmware revisions lack checksums.

Input thread VA `0x1400b6160` calls `hid_read_timeout` at `0x1400b6209` with timeout 500 ms, checks returned byte 0 equals `FA` at `0x1400b6216`, obtains payload length from input[5] at `0x1400b62fd`, and passes bytes starting input+6 onward. The input frame has **no HIDAPI zero prefix**: `FA command frame total field4 length payload...`. The precise semantics of input field4 are not established. The vendor parser appears to trust lengths; the new offline parser adds bounds checks.

WebHID `sendReport(0, payload128)` would receive the 128-byte payload beginning `FA`; HIDAPI/node-hid `write` would receive all 129 bytes beginning `00 FA`. This is an integration mapping, **not authorization to send reconstructed packets**.

## RGB serialization

`0x10` `sendSetCustomLight`, VA `0x1400a60e0`: USB construction `0x1400a6298..0x1400a6384` writes a four-byte prefix sourced from object fields `242,245,246,247`, followed a chunk from byte-array pointer object+`230`. Length is chunk bytes +4.

A subsequent UI-to-serializer trace resolves the **RGB order**. In `color-users.asm`, UI function `0x140037b30` calls `QColor::red/green/blue` at `0x140037b69/7a/8b`, storing them at offsets5/6/7 of an eight-byte packed struct. UI field this+`58` becomes packed offset2. It passes the packed struct as r9 to `0x1400b0660`; instructions `0x1400b068c..0x1400b06b7` extract packed bytes2/5/6/7 into object242/245/246/247 respectively. The helper copies the selected-key byte array to object+230 and calls `0x1400a60e0` at `0x1400b077f`.

Thus opcode10 payload is `[rawParameter, red, green, blue, ...selectedKeyBytes]`. RGB order is strongly established statically. `rawParameter` comes from the UI field but its firmware semantics/range are still unknown (brightness would be an inference). Physical-key correspondence of selectedKeyBytes remains unverified. `customKeys()` provides this exact offline shape while leaving the parameter raw and hardware integration disabled.

`0x11` bulk custom lighting, VA `0x1400a66d0`: a zero-filled packet has payload `[startIndex, ...N records of four bytes]`, length `1+4N`. The first payload byte is source-record offset0; each transmitted record is source-record offsets1,2,3,4 in order. Despite an erroneous `sendSetEffectLightAll` debug string in one branch, the USB result/error labels say `sendSetCustomLightAll`.

The reciprocal getter `0x16` returns `[startIndex, ...four-byte records]`. Receiver VA `0x1400968fb..0x1400969d3` reconstructs each source-record offset0 as `startIndex+i` and copies the four raw bytes to offsets1..4. This corroborates start-index addressing. The four bytes' semantic/color ordering is deliberately **not guessed** in the codec. Hardware-index correspondence to the database physical key map still needs verification.

## Hall actuation and rapid trigger serialization

`0x26` `sendSetTriggerConfig`, VA `0x1400ab700`: payload is two bytes from object+`260/261` (a little-endian word), followed selected key indices from object+`270`; length is index count+2. This is consistent with setting one threshold for multiple keys, but the threshold unit is not established. Helper `0x1400ae600`, at `0x1400ae68d..0x1400ae699`, copies this word into each selected key's source record offset2.

`0x27` `sendSetQuickTriggerConfig`, VA `0x1400aab70`: N eight-byte records. Each record is `[source.index, 00, source.field4, source.field5, source.field6.low, source.field6.high, source.field8.low, source.field8.high]`. Exact USB stores are `0x1400aae10..0x1400aaeb4`. The two boolean-like fields and two 16-bit threshold-like fields are present, but their enable/continuous/press/release meanings and units have not been proven.

`0x28` `sendSetTriggerConfigAll`, VA `0x1400abcb0`: payload `[startIndex, N, ...N eight-byte records]`, length `2+8N`. The eight bytes are source-record offsets2..9 in order. First source record supplies startIndex; keys are implicit contiguous indices. USB and non-USB branches use the same record shape after their framing shift.

Getter `0x2C` receiver `0x14009d6fb..0x14009d812` reads payload `[startIndex,...N eight-byte records]`, deriving N=(length-1)/8. It reconstructs source fields as:

| Raw record offsets | Source field | Observation |
|---|---|---|
| 0..1 | offset2 | LE16 |
| 2 | offset4 | converted to boolean |
| 3 | offset5 | converted to boolean |
| 4..5 | offset6 | LE16 |
| 6..7 | offset8 | LE16 |

The offline codec implements this exact byte layout without naming unknown fields as millimeters or firmware behaviors. The local profile editor's mm values cannot yet be converted into these raw units safely.

## High keys / SOCD

`0x23` `sendSetHighKey`, VA `0x1400a7b40`, writes fixed **19-byte slots**. Slot bytes0/1 are source index/type. Type-dependent branches populate different subsets and leave remaining bytes zero. Types0..5 are present. Type5 populates only slot bytes2,3,4 from corresponding source fields (`0x1400a7f35..0x1400a7f70`), consistent with a two-key-plus-mode operation. The English INI explicitly names SOCD and four priority modes, but **mapping type5 to SOCD and numeric mode codes is still an inference**. The codec therefore accepts opaque 19-byte records and does not provide an operational SOCD encoder.

## Product info and other commands

Full mapping is in `native-commands.json`: getters config `57`, RGB `16`, effect `17`, effect-name `18`, high key `2B`, keyboard config `2A`, macro `42`, product `62`, trigger `2C`, whole parameters `5E`; setters effect `13/14`, config info `56`, keymap `20`, default key `24`, macro `40`, whole `50`, profile switch `55`, add `58`, delete `59`.

**Do not treat product-info `62` as a harmless empty read:** VA `0x1400a3eb4..0x1400a3fbc` writes a seven-byte date/time payload: zero, `(year+0x30)&255`, month, day, hour, minute, second. The opcode's firmware side effects are unknown. Receiver `0x140099d34` reads two initial LE16 values and bit flags at payload+4, then strings at offsets depending on the program's packet-size global. Their field meanings and capability-flag semantics require further tracing.

Dangerous commands were identified but deliberately receive no app implementation: reset `61`, calibration state/report/save `52/53/54`, ADC `5B`, firmware transfer family `60/63/65/66`. Packet names do not justify sending these.

## Remaining blockers before enabling device Apply

1. Establish firmware identity and exact report descriptor without mutating settings.
2. Resolve RGB leading-parameter semantics and bulk-record layout, and prove physical key indices. Opcode10 RGB order is established; opcode11 four-byte records remain semantically incomplete.
3. Prove actuation/RT raw-unit scaling, bool semantics, valid ranges, and SOCD type/mode mapping.
4. Prove getter pagination, response matching, timeout/retry rules and persistence behavior for the connected firmware.
5. Implement and validate complete device readback backup/restore before any settings writes; an editor JSON export is not a hardware backup.
6. Compare offline encoded fixtures to authorized captures or independently established serializer inputs. Current tests are instruction-derived fixtures with synthetic source values, **not captured hardware traffic**.

Run `node --test tests/offline-codec.test.mjs` from the project directory. The codec imports no HID modules, performs no I/O, and is not connected to the configurator's Apply action. It is a reproducible analysis artifact, not a working hardware driver.
