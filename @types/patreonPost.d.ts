export declare interface patreonDownloadableContent {
    filename: string,
    downloadURL: string,
    type: "media"|"attachment"|"post"
}

export declare module patreonPostPageObject {

  export interface RootObject {
      data: Data[];
      included: patreonPostIncludeObject.RootObject[];
      meta: Meta;
  }

  export interface Image {
      height?: number;
      large_url?: string;
      thumb_url?: string;
      url?: string;
      width?: number;
  }

  export interface PostFile {
      name?: string;
      url?: string;
  }

  export interface Attributes {
      content: string;
      current_user_can_view: boolean;
      image?: Image;
      patreon_url: string;
      post_file?: PostFile;
      post_type?: string;
      published_at: Date;
      title: string;
  }

  export interface Data {
      attributes: Attributes;
      id: string;
      type: string;
  }

  export interface Meta {
    posts_count: number;
  }
}

declare module patreonPostIncludeObject {

    export interface RootObject {
        attributes: Attributes;
        id: string;
        relationships: Relationships;
        type: string;
    }

    export interface ImageUrls {
        default: string;
        original: string;
        thumbnail: string;
    }

    export interface Dimensions {
        h: number;
        w: number;
    }

    export interface Metadata {
        dimensions: Dimensions;
    }

    export interface Attributes {
        full_name: string;
        image_url: string;
        url: string;
        avatar_photo_url: string;
        currency: string;
        earnings_visibility: string;
        is_monthly?: boolean;
        is_nsfw?: boolean;
        name: string;
        show_audio_post_download_links?: boolean;
        download_url: string;
        file_name: string;
        image_urls: ImageUrls;
        metadata: Metadata;
        tag_type: string;
        value: string;
        access_rule_type: string;
        amount_cents?: number;
        post_count?: number;
        amount?: number;
        created_at?: Date;
        description: string;
        patron_currency: string;
        remaining?: number;
        requires_shipping?: boolean;
        user_limit?: any;
        discord_role_ids?: any;
        edited_at?: Date;
        patron_amount_cents?: number;
        published?: boolean;
        published_at?: Date;
        title: string;
        unpublished_at?: any;
        welcome_message?: any;
        welcome_message_unsafe?: any;
        welcome_video_embed?: any;
        welcome_video_url?: any;
        completed_percentage?: number;
        reached_at?: Date;
    }

    export interface Data {
        id: string;
        type: string;
    }

    export interface Links {
        related: string;
    }

    export interface Campaign {
        data: Data;
        links: Links;
    }

    export interface Creator {
        data: Data;
        links: Links;
    }

    export interface Data {
        id: string;
        type: string;
    }

    export interface Goals {
        data: Data[];
    }

    export interface Rewards {
        data: Data[];
    }

    export interface Post {
        data: Data;
        links: Links;
    }

    export interface Relationships {
        campaign: Campaign;
        creator: Creator;
        goals: Goals;
        rewards: Rewards;
        post: Post;
    }
}