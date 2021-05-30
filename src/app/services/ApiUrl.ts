export  class ApiUrl {
  /**后台服务*/
  public static SERVER:string = 'https://www.trinity-tech.io/feeds/api/v2';
  public static NFTSERVER:string =  'https://ipfs-test.trinity-feeds.app/api/v0';
  /**register*/
  public static register:string = ApiUrl.SERVER +'/register';

   /**listAll*/
  public static listAll:string = ApiUrl.SERVER +'/listAll';

  /**get*/
  public static get:string = ApiUrl.SERVER +'/get';

   /**remove*/
  public static remove:string = ApiUrl.SERVER +'/remove';

  /**listPage*/
  public static listPage:string = ApiUrl.SERVER +'/listPage';

  /**update*/
  public static update:string = ApiUrl.SERVER +'/update';

  /**NFT*/
  public static nftAdd:string = ApiUrl.NFTSERVER +"/add";
}
