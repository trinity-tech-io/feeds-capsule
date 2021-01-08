export  class ApiUrl {
  /**后台服务*/
  //public static SERVER:string = 'https://www.trinity-tech.io/feeds/api/v1';
  public static SERVER:string = 'https://www.trinity-tech.io/feeds/api/v2';
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
}
