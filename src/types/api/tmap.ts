export interface TmapReverseGeocodeResponse {
  addressInfo: {
    fullAddress: string;
    city_do: string;
    gu_gun: string;
    eup_myun: string;
    adminDong: string;
    legalDong: string;
    ri: string;
    roadName: string;
    buildingName: string;
    addressKey: string;
    roadAddressKey: string;
  };
}

export interface TmapPoiResponse {
  searchPoiInfo: {
    totalCount: string;
    count: string;
    page: string;
    pois: {
      poi: Array<{
        id: string;
        name: string;
        telNo: string;
        frontLat: string;
        frontLon: string;
        noorLat: string;
        noorLon: string;
        newAddressList: {
          newAddress: Array<{
            centerLat: string;
            centerLon: string;
            fullAddressRoad: string;
          }>;
        };
        upperAddrName: string;
        middleAddrName: string;
        lowerAddrName: string;
      }>;
    };
  };
}
