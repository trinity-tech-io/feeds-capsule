export class Config {
    public static APPLICATION_DID = 'did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg';
    public static TRINITY_API = 'trinity-tech.cn';
    public static ELASTOS_API = 'elastos.io';

    private static BASE_API = Config.ELASTOS_API;

    public static EID_RPC = 'https://api.' + Config.BASE_API + '/eid';

    /**后台服务*/
    public static SERVER: string = 'https://www.trinity-tech.io/feeds/api/v2';

    /** MainNet contract */
    public static STICKER_ADDRESS: string = '0x020c7303664bc88ae92cE3D380BF361E03B78B81';
    public static PASAR_ADDRESS: string = '0xa18667008b9869145a05efB25BADda40ADA7253e';
    public static CONTRACT_URI = 'https://api.' + Config.BASE_API + '/eth';
    public static CONTRACT_RPC = {
        20: Config.CONTRACT_URI
    }
    /** MainNet IPFS */
    public static IPFS_SERVER: string = 'https://ipfs.trinity-feeds.app/';


    /** TestNet contract */
    public static STICKER_TEST_ADDRESS: string = '0xed1978c53731997f4DAfBA47C9b07957Ef6F3961';
    public static PASAR_TEST_ADDRESS: string = '0x2652d10A5e525959F7120b56f2D7a9cD0f6ee087';
    public static CONTRACT_TEST_URI = 'https://api-testnet.' + Config.BASE_API + '/eth';
    public static CONTRACT_TEST_RPC = {
        21: Config.CONTRACT_TEST_URI
    }
    /** TestNet IPFS */
    public static IPFS_TEST_SERVER: string = 'https://ipfs-test.trinity-feeds.app/';

    public static changeApi(api: string) {
        console.log("api is", api);
        if (api == 'elastos.io')
            Config.BASE_API = Config.ELASTOS_API;
        else
            Config.BASE_API = Config.TRINITY_API;

        console.log("Config.BASE_API is", Config.BASE_API);
        Config.reset();
    }

    static reset() {
        Config.EID_RPC = 'https://api.' + Config.BASE_API + '/eid';
        Config.CONTRACT_URI = 'https://api.' + Config.BASE_API + '/eth';
        Config.CONTRACT_RPC = {
            20: Config.CONTRACT_URI
        }

        Config.CONTRACT_TEST_URI = 'https://api-testnet.' + Config.BASE_API + '/eth';
        Config.CONTRACT_TEST_RPC = {
            21: Config.CONTRACT_TEST_URI
        }
    }
}
