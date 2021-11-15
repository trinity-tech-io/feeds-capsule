import { Config } from "./config";

export class ApiUrl {
  /**后台服务*/
  public static SERVER: string = Config.SERVER;

  /** IPFS 测试网络 */
  public static IPFS_TEST_SERVER: string = Config.IPFS_TEST_SERVER;
  /** IPFS 正式网络 */
  public static IPFS_SERVER: string = Config.IPFS_SERVER;
  /** Assist 正式网络 */
  public static ASSIST_SERVER: string = Config.ASSIST_SERVER;
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

  public static getAvatar: string = ApiUrl.SERVER+ '/getAvatar';

  public static IPFS_NFT_ADD: string = 'api/v0/add';
  public static IPFS_NFT_GET: string = 'ipfs/';
  public static setIpfs(ipfsBaseUrl: string) {
    Config.IPFS_SERVER = ipfsBaseUrl;
    ApiUrl.IPFS_SERVER = Config.IPFS_SERVER;
  }

  public static getIpfs() : string {
    return Config.IPFS_SERVER;
  }

  public static setAssist(assistBaseUrl: string){
    Config.ASSIST_SERVER = assistBaseUrl;
    ApiUrl.ASSIST_SERVER =  Config.ASSIST_SERVER;
  }

  public static getAssist(){
     return Config.ASSIST_SERVER;
  }

  /** whitelist testNet */
  public static getWhiteList =Config.WHITELIST_TEST_SERVER+'pasar/api/v1/whitelist';
  public static getWhiteListByAddress =Config.WHITELIST_TEST_SERVER+'pasar/api/v1/whitelist?address=';

}
