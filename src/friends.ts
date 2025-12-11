// ============================================
// 友情链接配置
// ============================================

export interface FriendLink {
    name: string;
    description: string;
    url: string;
    avatar: string;
    addDate?: string;
    recommended?: boolean;
    disconnected?: boolean; // 是否失联
}

export const FRIEND_LINKS: FriendLink[] = [
    {
        name: "纸鹿摸鱼处",
        description: "纸鹿至麓不知路，支炉制露不止漉",
        url: "https://blog.zhilu.site/",
        avatar: "https://www.zhilu.site/api/avatar.png",
        addDate: "2025-09-03",
        recommended: true
    },
    {
        name: "Luxynth",
        description: "我心匪石不可转",
        url: "https://www.luxynth.cn",
        avatar: "https://www.luxynth.cn/assets/images/avatar.jpg",
        addDate: "2025-09-09",
        disconnected: true
    },
    {
        name: "鈴奈咲桜のBlog",
        description: "愛することを忘れないで",
        url: "https://blog.sakura.ink",
        avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=2731443459&spec=5",
        addDate: "2025-09-09",
        recommended: true
    },
    {
        name: "Almango",
        description: "天真永不消逝，浪漫至死不渝。",
        url: "https://www.almango.cn/",
        avatar: "https://www.almango.cn/img/favicon.png",
        addDate: "2025-09-09",
        recommended: true
    },
    {
        name: "kzhik's website",
        description: "EXPLORE THE WORLD!",
        url: "https://www.kzhik.cn",
        avatar: "https://www.kzhik.cn/avatar.webp",
        addDate: "2025-09-09",
        recommended: true
    },
    {
        name: "成烁BLOG",
        description: "致一锦程 探索不停",
        url: "https://blog.chengshuo.top",
        avatar: "https://blog.chengshuo.top/usr/uploads/2025/08/1293883047.webp",
        addDate: "2025-09-10"
    },
    {
        name: "落尘up",
        description: "不止于代码与技术，更关注生活与思考。在喧嚣中落下的尘埃，亦能闪烁微光。",
        url: "https://www.luochen.chat/",
        avatar: "https://www.luochenup.xyz/b_a5a3aa888355bdc617dca021efb19ab8.png",
        addDate: "2025-09-11"
    },
    {
        name: "硅基漫游指南",
        description: "等待和犹豫才是这个世界上最无情的杀手",
        url: "https://blog.helong.online",
        avatar: "https://oss.helong.online/bucket-IMG/bea2394fef15b88de49ae37707b3c1b86d7dbc2035a752ef2581a8b6cb3b2e8c.png",
        addDate: "2025-09-11"
    },
    {
        name: "喵洛阁",
        description: "愿你看清一切真相后，依旧热爱你的家人和朋友。",
        url: "https://blog-v3.kemeow.top",
        avatar: "https://img.314926.xyz/images/2025/08/13/no-background-kemiaofxjun.webp",
        addDate: "2025-09-11"
    },
    {
        name: "紫血小站",
        description: "人山人海人来人往,自尊自爱自由自在",
        url: "https://blog.ziyibbs.com/",
        avatar: "https://blog.ziyibbs.com/favicon/logo.png",
        addDate: "2025-09-11"
    },
    {
        name: "RefactX Project",
        description: "形体是简单而纯粹的，它不是完整的群体，每个形体都指向其复杂性，并最终被复杂性联系在一起。",
        url: "https://www.refact.cc/",
        avatar: "https://www.refact.cc/avatar.png",
        addDate: "2025-09-21"
    },
    {
        name: "酥米的小站",
        description: "终有一日，寻梦中人",
        url: "https://www.sumi233.top/",
        avatar: "https://cdn.sumi233.top/gh/huang233893/blog-image-bed/top/huang233893/imgs/blog/userfb6a1018b84ce485.jpg",
        addDate: "2025-09-21"
    },
    {
        name: "雪萌天文台",
        description: "发现巷子里的那颗星星",
        url: "https://blog.snowy.moe/",
        avatar: "https://img.snowy.moe/head.png",
        addDate: "2025-09-22"
    },
    {
        name: "森语 - SENblog",
        description: "无限进步！",
        url: "https://blog.sakurasen.cn",
        avatar: "https://sakurasen.cn/icon",
        addDate: "2025-09-24"
    },
    {
        name: "UTOPIA",
        description: "散落在世界一角的故事",
        url: "https://ishya.top",
        avatar: "https://ishya.top/source/imgs/avatar.jpg",
        addDate: "2025-09-24"
    },
    {
        name: "喜之梁",
        description: "多点关心多点爱",
        url: "https://blog.liang.one",
        avatar: "https://bu.dusays.com/2025/10/02/68de1a78e7aa4.webp",
        addDate: "2025-10-08"
    },
    {
        name: "春华秋实",
        description: "无恙桃花，依然燕子，春景多别",
        url: "https://linqiushi.top",
        avatar: "https://youke1.picui.cn/s1/2025/10/07/68e52c2a55563.png",
        addDate: "2025-10-09",
        disconnected: true
    },
    {
        name: "SatouのBlog",
        description: "彼女の愛は、甘くて痛い",
        url: "https://www.matsusatou.top/",
        avatar: "https://github.com/SokiSama/picked/blob/main/avatar.jpg?raw=true",
        addDate: "2025-10-15"
    },
    {
        name: "阿叶Ayeez的小站",
        description: "记录学习历程，记录美好生活",
        url: "https://blog.Ayeez.cn",
        avatar: "https://blog.ayeez.cn/imgs/photo.jpg",
        addDate: "2025-11-15"
    },
    {
        name: "AiQiji·工具箱",
        description: "记录学习历程，记录美好生活",
        url: "https://tools.aiqji.com/",
        avatar: "https://tools.aiqji.com/favicon.svg",
        addDate: "2025-11-15"
    },
    {
        name: "Nebula Blog",
        description: "Nebula.SYS",
        url: "https://www.996icu.eu.org/",
        avatar: "https://img.scdn.io/i/692d847f79589_1764590719.webp",
        addDate: "2025-12-02"
    },
    {
        name: "AlexMa's Blog",
        description: "Create things with love.",
        url: "https://blog.alexma.top/",
        avatar: "https://blog-backend.alexma.top/api/v2/objects/avatar/112zjnt1f3c2cf3prp.webp",
        addDate: "2025-12-11"
    },
];