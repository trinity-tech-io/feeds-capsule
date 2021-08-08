import { Config } from "./config";

export class ApiUrl {
  /**后台服务*/
  public static SERVER: string = Config.SERVER;

  /** IPFS 测试网络 */
  public static IPFS_TEST_SERVER: string = Config.IPFS_TEST_SERVER;
  /** IPFS 正式网络 */
  public static IPFS_SERVER: string = Config.IPFS_SERVER;

  /**register*/
  public static register: string = ApiUrl.SERVER + '/register';

  /**listAll*/
  public static listAll: string = ApiUrl.SERVER + '/listAll';

  /**get*/
  public static get: string = ApiUrl.SERVER + '/get';

  /**remove*/
  public static remove: string = ApiUrl.SERVER + '/remove';

  /**listPage*/
  public static listPage: string = ApiUrl.SERVER + '/listPage';

  /**update*/
  public static update: string = ApiUrl.SERVER + '/update';

  /**NFT IPFS*/
  // public static nftAdd: string = ApiUrl.IPFS_TEST_SERVER + 'api/v0/add';
  // public static nftGet: string = ApiUrl.IPFS_TEST_SERVER + 'ipfs/';
  public static IPFS_NFT_ADD: string = 'api/v0/add';
  public static IPFS_NFT_GET: string = 'ipfs/';

  // public static PASAR_ADDRESS: string = Config.PASAR_ADDRESS;
  // public static PASAR_TEST_ADDRESS: string = Config.PASAR_TEST_ADDRESS;

  // public static STICKER_ADDRESS: string = Config.STICKER_ADDRESS;
  // public static STICKER_TEST_ADDRESS: string = Config.STICKER_TEST_ADDRESS;
}
