declare namespace HiveData {
    type Channels = {
        channel_id: string;
        created_at: number;
        updated_at: number;
        name: string;
        introduction: string;
        avatar: string;
        memo: string;
        type: string;// private  public  group  friends
        isSubscribed: boolean;
    };

    type Post = {
        post_id: string;
        channel_id: number;
        created_at: number;
        update_at: number;
        content: FeedsData.Content;
        status: number; // 2除删已 1改修已 0通普 
        memo: number;
        type: number;
        tag: number;
    };


}