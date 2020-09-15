export  class ApiUrl {
  /**后台服务*/
  public static SERVER:string = 'https://www.trinity-tech.io/api/v1';

  public static SERVER1:string = 'https://feeds.yoopig.com/api/v1';

  /**register*/
  public static register:string = ApiUrl.SERVER1 +'/register';

   /**listAll*/
  public static listAll:string = ApiUrl.SERVER1 +'/listAll';

  /**get*/
  public static get:string = ApiUrl.SERVER1 +'/get';

   /**remove*/
  public static remove:string = ApiUrl.SERVER1 +'/remove';

  /**listPage*/
  public static listPage:string = ApiUrl.SERVER1 +'/listPage';

   /**update*/
   public static update:string = ApiUrl.SERVER1 +'/update';
}
