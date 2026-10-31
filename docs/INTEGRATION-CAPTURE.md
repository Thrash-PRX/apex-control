# Integration capture and backup gate

Observed identity is 314B:1026, collection FF02:0002 on Windows interface 0. Windows I/O reports are 65 bytes including report ID; WebHID separates that byte. No feature reports are declared. The static program default of 129 HIDAPI bytes is not an observed device report length. Sinowealth 3402:0300 was a disproven identity hypothesis, not static device identification.

All physical output and feature writes remain blocked, including getter requests sent through output reports. No hardware operations were performed during integration.

Capture path: use USBPcap/Wireshark to observe vendor software enumeration and baseline reads, filtering usb.idVendor == 0x314b. Keep original captures private; retain sanitized packet fixtures with report IDs, direction, lengths, timing, firmware identity, and source hashes. Establish request/response opcode mapping and host-driven versus device-driven pagination before accepting a transaction. Do not infer opcode echo or multi-frame streaming from the offline response assembler.

The protocol branch's 0x16 start/count request and RGB byte meanings are candidate reconstructions, not verified getters or color semantics. Retained static evidence deliberately leaves the four bulk RGB bytes opaque. The uncommitted readback module in the original checkout is preserved separately and is not integrated without its referenced evidence document. Product-info 0x62 may have side effects and must not be used as a harmless probe.

Backup path: collect all independently identified configuration sections, preserve raw bytes and unknown fields, bind to descriptor/firmware identity, reject missing/duplicate/wrapping/mismatched pages, and export only complete sections with integrity hashes. A section export or browser profile is not a complete device backup. Restore requires separate captured validation and remains disabled. Millimetre scaling, SOCD codes, display commands, calibration, reset, and firmware transfer remain unsupported.
