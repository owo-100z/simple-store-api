export default {
    baemin: {
        "OWNER_INFO_URL": "https://self-api.baemin.com/v1/session/profile",
        "SHOP_INFO_URL": "https://self-api.baemin.com/v4/store/shops/search",
        "OWNER_URL_V1": "https://self-api.baemin.com/v1/menu-sys/core/v1/shop-owners/",
        "OWNER_URL_V2": "https://self-api.baemin.com/v1/menu-sys/core/v2/shop-owners/",
        "GET_MENU_LIST_URL": "/menus/one-shop",
        "SOLDOUT_MENU_URL": "/status/menus/soldout",
        "ACTIVE_MENU_URL": "/status/menus/active",
        "GET_OPTION_GROUP_URL": "/option-groups",
        "SOLDOUT_OPTION_URL": "/status/options/soldout",
        "ACTIVE_OPTION_URL": "/status/options/active"
    },
    coupang: {
        "SHOP_INFO_URL": "/api/v1/merchant/web/stores/",
        "GET_MENU_LIST_URL": "/all-menu-dishes",
        "GET_OPTION_URL": "/all-options?fetchDish=true",
        "UPDATE_STATUS_URL": "/api/v1/merchant/web/catalog/stores/",
        "CHANGE_STATUS_MENU": "/dishes/update-status",
        "CHANGE_STATUS_OPTION": "/option-items/update-status",
    },
    ddangyo: {
        "SHOP_INFO_URL": "/o2o/shop/cm/requestBossInfo",
        "GET_MENU_LIST_URL": "/o2o/shop/me/requestChgMenuSoldOut",
        "GET_OPTION_URL": "/o2o/shop/me/requestChgSoldOutOpt",
        "CHANGE_STATUS_MENU": "/o2o/shop/me/requestChgMenuSoldOutUpdateWeb",
        "CHANGE_STATUS_OPTION": "/o2o/shop/me/requestChgSoldOutOptUpdate",
    },
}