interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
  exclusionFilters?: HIDDeviceFilter[];
}

interface HIDCollectionInfo {
  usagePage?: number;
  usage?: number;
  type?: number;
  children?: HIDCollectionInfo[];
  inputReports?: HIDReportInfo[];
  outputReports?: HIDReportInfo[];
  featureReports?: HIDReportInfo[];
}

interface HIDReportInfo {
  reportId: number;
  items: { reportSize: number; reportCount: number }[];
}

interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly data: DataView;
}

interface HIDDevice extends EventTarget {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: HIDCollectionInfo[];

  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource | Uint8Array): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource | Uint8Array): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;

  addEventListener(
    type: 'inputreport',
    listener: (this: HIDDevice, ev: HIDInputReportEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: 'inputreport',
    listener: (this: HIDDevice, ev: HIDInputReportEvent) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Navigator {
  readonly hid: {
    getDevices(): Promise<HIDDevice[]>;
    requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  };
}
