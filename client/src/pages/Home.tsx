import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Play,
  Sparkles,
  X,
  Youtube,
} from "lucide-react";

const ASSETS = {
  hero: "/manus-storage/japanese-travel-journal-hero_b2d8cbf8.png",
  travelPortrait: "/manus-storage/p-love-japan-avatar_a554f8d7.jpg",
  bagPortrait: "/manus-storage/pp-bag-avatar_298e4b89.jpg",
};

type Video = {
  id: string;
  title: string;
  label: string;
  meta: string;
  type: "latest" | "featured";
};

type Channel = {
  key: "travel" | "bag";
  name: string;
  handle: string;
  intro: string;
  accent: string;
  dot: string;
  subscribers: string;
  videos: string;
  views: string;
  joined: string;
  channelUrl: string;
  portrait: string;
  tags: string[];
  videosList: Video[];
};

const channels: Channel[] = [
  {
    key: "travel",
    name: "貝遊日本",
    handle: "P LOVE JAPAN",
    intro: "為準備自由行的人，把景點、交通、住宿與在地美食剪成一份可以帶著走的旅程筆記。",
    accent: "rose",
    dot: "bg-[#d46e65]",
    subscribers: "168K",
    videos: "377",
    views: "34.4M",
    joined: "2015.05.15",
    channelUrl: "https://www.youtube.com/@plovejapan",
    portrait: ASSETS.travelPortrait,
    tags: ["日本自由行", "深度旅遊", "交通攻略", "溫泉旅館", "地方美食"],
    videosList: [
      {
        id: "g2zBypkm-lo",
        title: "沖繩離島 7 天遊｜八重山群島篇",
        label: "最新旅程",
        meta: "54K views · 40:08",
        type: "latest",
      },
      {
        id: "PbfJKWu9-1M",
        title: "沖繩離島 7 天遊｜宮古群島篇",
        label: "最新旅程",
        meta: "67K views · 34:27",
        type: "latest",
      },
      {
        id: "BodeQ2VaiKY",
        title: "箱根 3 日 2 夜｜周遊券旅程",
        label: "人氣精選 · 428K views",
        meta: "3 years ago · 18:38",
        type: "featured",
      },
    ],
  },
  {
    key: "bag",
    name: "貝背包",
    handle: "PPBAG",
    intro: "由日式生活靈感，到香港探索與 AI 實用教學；把好奇心收進背包，分享更聰明、更自在的日常。",
    accent: "sage",
    dot: "bg-[#7c9980]",
    subscribers: "196K",
    videos: "167",
    views: "24.5M",
    joined: "2020.09.10",
    channelUrl: "https://www.youtube.com/@ppbag",
    portrait: ASSETS.bagPortrait,
    tags: ["AI 新手", "AI 自動化", "香港探索", "日式家居", "生活分享"],
    videosList: [
      {
        id: "Uhj0go8nQ54",
        title: "AI Website Development Guide｜5 個程度實戰",
        label: "最新影片",
        meta: "21K views · 32:58",
        type: "latest",
      },
      {
        id: "JMxLulPqAGo",
        title: "3 個超實用 AI 自動工作流",
        label: "最新影片",
        meta: "51K views · 16:56",
        type: "latest",
      },
      {
        id: "xRIH8gdbVGI",
        title: "東平洲｜世外桃源環島一日遊",
        label: "人氣精選 · 667K views",
        meta: "5 years ago · 15:58",
        type: "featured",
      },
    ],
  },
];

const navItems = [
  { label: "關於阿貝", href: "#about" },
  { label: "兩個頻道", href: "#channels" },
  { label: "精選作品", href: "#watch" },
  { label: "合作聯絡", href: "#contact" },
];

function DotGrid() {
  return <span className="dot-grid" aria-hidden="true" />;
}

function Tape({ className = "" }: { className?: string }) {
  return <span className={`tape ${className}`} aria-hidden="true" />;
}

function Scribble({ className = "" }: { className?: string }) {
  return <span className={`scribble ${className}`} aria-hidden="true" />;
}

function VideoCard({ video, theme }: { video: Video; theme: "rose" | "sage" }) {
  const isFeatured = video.type === "featured";
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noreferrer"
      className={`video-card group ${theme} ${isFeatured ? "featured" : ""}`}
      aria-label={`在 YouTube 觀看：${video.title}`}
    >
      <div className="video-image-wrap">
        <img
          src={`https://i.ytimg.com/vi/${video.id}/hq720.jpg`}
          alt=""
          className="video-image"
          loading="lazy"
        />
        <span className="video-play"><Play size={15} fill="currentColor" /></span>
        <span className="video-label">{video.label}</span>
      </div>
      <div className="video-copy">
        <h4>{video.title}</h4>
        <p>{video.meta}</p>
      </div>
    </a>
  );
}

function ChannelSection({ channel, index }: { channel: Channel; index: number }) {
  const [latestOne, latestTwo, featured] = channel.videosList;
  const isTravel = channel.key === "travel";

  return (
    <article className={`channel-sheet ${channel.accent}`} id={index === 0 ? "channels" : undefined}>
      <Tape className={isTravel ? "top-right" : "top-left"} />
      <div className="channel-header">
        <div className="channel-stamp-row">
          <span className={`channel-number ${channel.dot}`}>0{index + 1}</span>
          <span className="eyebrow">YOUTUBE CHANNEL</span>
        </div>
        <a href={channel.channelUrl} target="_blank" rel="noreferrer" className="channel-title-link">
          <div className="portrait-stack">
            <img src={channel.portrait} alt={`${channel.name} 頻道頭像`} />
            <span className="portrait-ring" />
          </div>
          <div>
            <h3>{channel.name}</h3>
            <p className="channel-handle">@{channel.handle.toLowerCase()}</p>
          </div>
          <ArrowUpRight size={20} className="channel-arrow" />
        </a>
      </div>

      <p className="channel-intro">{channel.intro}</p>

      <div className="channel-metrics" aria-label={`${channel.name} 頻道數據`}>
        <div><strong>{channel.subscribers}</strong><span>訂閱者</span></div>
        <div><strong>{channel.videos}</strong><span>公開影片</span></div>
        <div><strong>{channel.views}</strong><span>總觀看</span></div>
        <div><strong>{channel.joined}</strong><span>加入 YouTube</span></div>
      </div>

      <div className="channel-tags">
        {channel.tags.map((tag) => <span key={tag}>#{tag}</span>)}
      </div>

      <div className="channel-videos">
        <div className="mini-section-head"><span>RECENTLY</span><small>最新分享</small></div>
        <div className="two-video-grid">
          <VideoCard video={latestOne} theme={channel.accent as "rose" | "sage"} />
          <VideoCard video={latestTwo} theme={channel.accent as "rose" | "sage"} />
        </div>
        <div className="mini-section-head pick"><span>EDITOR'S PICK</span><small>人氣精選</small></div>
        <VideoCard video={featured} theme={channel.accent as "rose" | "sage"} />
      </div>

      <a className="channel-button" href={channel.channelUrl} target="_blank" rel="noreferrer">
        前往 {channel.name} 頻道 <ArrowUpRight size={17} />
      </a>
    </article>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="site-shell">
      <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
        <a href="#top" className="brand" aria-label="回到頁首" onClick={closeMenu}>
          <span className="brand-mark">P</span>
          <span><b>ABE</b><em>MEDIA NOTEBOOK</em></span>
        </a>
        <nav className="desktop-nav" aria-label="主要導覽">
          {navItems.map((item, index) => <a href={item.href} key={item.href}>{String(index + 1).padStart(2, "0")} <span>{item.label}</span></a>)}
        </nav>
        <a className="nav-contact" href="#contact">LET'S TALK <ArrowDownRight size={16} /></a>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "關閉選單" : "開啟選單"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="流動裝置導覽">
          {navItems.map((item) => <a href={item.href} key={item.href} onClick={closeMenu}>{item.label}<ChevronRight size={18} /></a>)}
        </nav>
      )}

      <section className="hero" id="top">
        <img src={ASSETS.hero} alt="日式手帳風旅行與創作拼貼背景" className="hero-art" />
        <div className="hero-grain" />
        <div className="hero-inner">
          <p className="hero-kicker"><span /> HONG KONG CREATOR · SINCE 2015</p>
          <div className="hero-title-block">
            <p className="hero-jp">旅を、知るを、もっと楽しく。</p>
            <h1>阿貝的<br /><i>創作筆記</i></h1>
            <p className="hero-description">從日本旅途到 AI 日常，<br />用真誠與細節，把世界分享給你。</p>
          </div>
          <div className="hero-profile-note">
            <Tape className="tilt-left" />
            <div className="profile-photo-frame">
              <img src={ASSETS.travelPortrait} alt="阿貝於貝遊日本頻道的個人頭像" />
            </div>
            <div className="profile-note-copy"><span>CREATOR</span><b>ABE / 阿貝</b><small>TRAVEL · LIFE · AI</small></div>
          </div>
          <a href="#channels" className="scroll-note"><span>SCROLL TO EXPLORE</span><ArrowDownRight size={18} /></a>
          <div className="hero-stats">
            <div><b>364K</b><span>CHANNEL FOLLOWERS</span></div>
            <div><b>544+</b><span>VIDEOS SHARED</span></div>
            <div><b>10+</b><span>YEARS OF STORIES</span></div>
          </div>
        </div>
      </section>

      <section className="intro-section" id="about">
        <div className="section-index"><span>01</span><i /> <b>ABOUT ABE</b></div>
        <div className="intro-layout">
          <div className="intro-aside">
            <p className="vertical-label">あべ の クリエイティブ・ジャーニー</p>
            <div className="hand-drawn-star">✦</div>
          </div>
          <div className="intro-content">
            <p className="intro-lead">不只是一個目的地，<br />而是一份<strong>值得收藏的體驗。</strong></p>
            <div className="intro-body">
              <p>我是阿貝，一位以廣東話分享所見所想的香港創作者。十多年來，我把走過的日本路線、細味過的地方風景，以及親手試過的實用資訊，整理成觀眾可以直接參考的影像筆記。</p>
              <p>在 <em>貝遊日本</em>，會看見細節滿載的旅遊企劃；在 <em>貝背包 PPBAG</em>，則會遇見生活靈感、香港探索與近年的 AI 學習分享。每條影片，都希望令下一次出發或下一步嘗試，變得更有把握。</p>
            </div>
            <div className="identity-strip">
              <span><MapPin size={16} /> HONG KONG</span>
              <span><Sparkles size={16} /> 2 CHANNELS</span>
              <span><Play size={15} fill="currentColor" /> 58.9M VIEWS</span>
            </div>
          </div>
          <aside className="mini-polaroid">
            <Tape className="top" />
            <img src={ASSETS.bagPortrait} alt="阿貝於貝背包頻道的個人頭像" />
            <p>curious<br />always.</p>
            <Scribble className="bottom-scribble" />
          </aside>
        </div>
      </section>

      <section className="channels-section">
        <div className="section-head wide">
          <div>
            <p className="eyebrow">TWO CORNERS OF ABE'S WORLD</p>
            <h2>兩個頻道，<br /><i>同一份好奇心。</i></h2>
          </div>
          <p className="section-side-copy">一邊寫下日本的完整路線，<br />一邊打開生活與科技的新問題。</p>
        </div>
        <div className="channel-grid">
          {channels.map((channel, index) => <ChannelSection channel={channel} index={index} key={channel.key} />)}
        </div>
        <p className="data-note">公開數據更新於 2026.08.29 · 訂閱與觀看數會隨頻道公開資料變動</p>
      </section>

      <section className="watch-section" id="watch">
        <div className="watch-head">
          <div className="section-index light"><span>03</span><i /> <b>WATCH & DISCOVER</b></div>
          <h2>一按就出發，<br /><i>或開始學習。</i></h2>
        </div>
        <div className="watch-collage">
          <a href="https://www.youtube.com/watch?v=qZOheEbMGN0" target="_blank" rel="noreferrer" className="collage-card tokyo">
            <img src="https://i.ytimg.com/vi/qZOheEbMGN0/maxresdefault.jpg" alt="貝遊日本：東京一日之旅影片縮圖" loading="lazy" />
            <span className="floating-play"><Play fill="currentColor" size={19} /></span>
            <div><small>貝遊日本 · 10週年</small><strong>東京一日之旅</strong></div>
          </a>
          <a href="https://www.youtube.com/watch?v=Lgqptgijqvo" target="_blank" rel="noreferrer" className="collage-card ai">
            <img src="https://i.ytimg.com/vi/Lgqptgijqvo/maxresdefault.jpg" alt="貝背包：AI 新手入門影片縮圖" loading="lazy" />
            <span className="floating-play"><Play fill="currentColor" size={19} /></span>
            <div><small>貝背包 PPBAG</small><strong>AI 新手入門</strong></div>
          </a>
          <div className="collage-word-note"><span>旅</span><p>PLAY<br />LEARN<br />GO</p><Scribble /></div>
        </div>
      </section>

      <section className="tags-section">
        <div className="section-index"><span>04</span><i /> <b>WHAT WE TALK ABOUT</b></div>
        <div className="tags-layout">
          <div>
            <h2>熱門內容<br /><i>關鍵字。</i></h2>
            <p>為每一種好奇心，留下可重看的入口。</p>
          </div>
          <div className="big-tags" aria-label="熱門影片標籤">
            {[
              ["#日本自由行", "rose"], ["#AI新手", "sage"], ["#沖繩", "paper"], ["#香港探索", "indigo"],
              ["#AI自動化", "sage"], ["#溫泉旅館", "rose"], ["#日式家居", "paper"], ["#旅遊攻略", "indigo"],
              ["#地方美食", "rose"], ["#生活分享", "sage"],
            ].map(([tag, color], index) => <span className={`big-tag ${color}`} key={tag} style={{ transform: `rotate(${[-2, 1, -1, 2, -2, 1, -1, 2, -2, 1][index]}deg)` }}>{tag}</span>)}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <DotGrid />
        <div className="contact-header">
          <p className="eyebrow">COLLABORATION NOTE</p>
          <h2>有一個好故事，<br /><i>不如一起說。</i></h2>
          <p>歡迎旅遊、生活、科技與品牌企劃合作。請告訴我你的想法、時間表和期待，一起找最合適的分享方式。</p>
        </div>
        <div className="contact-cards">
          <a href="mailto:plovejapan@gmail.com?subject=合作邀請｜貝遊日本" className="contact-card rose-card">
            <span className="contact-icon"><Mail size={20} /></span>
            <small>TRAVEL · JAPAN</small>
            <strong>貝遊日本</strong>
            <em>plovejapan@gmail.com</em>
            <span className="contact-arrow"><ArrowUpRight size={22} /></span>
          </a>
          <a href="mailto:ppbag97@gmail.com?subject=合作邀請｜貝背包 PPBAG" className="contact-card sage-card">
            <span className="contact-icon"><Mail size={20} /></span>
            <small>LIFE · AI · HONG KONG</small>
            <strong>貝背包 PPBAG</strong>
            <em>ppbag97@gmail.com</em>
            <span className="contact-arrow"><ArrowUpRight size={22} /></span>
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand"><span className="brand-mark">P</span><p><b>ABE MEDIA NOTEBOOK</b><br />made with curiosity in Hong Kong</p></div>
        <div className="social-links" aria-label="社群連結">
          <a href="https://www.youtube.com/@plovejapan" target="_blank" rel="noreferrer"><Youtube size={17} /> 貝遊日本</a>
          <a href="https://www.youtube.com/@ppbag" target="_blank" rel="noreferrer"><Youtube size={17} /> 貝背包</a>
          <a href="https://www.instagram.com/plovejapan/" target="_blank" rel="noreferrer"><Instagram size={17} /> @plovejapan</a>
          <a href="https://www.instagram.com/ppbag97/" target="_blank" rel="noreferrer"><Instagram size={17} /> @ppbag97</a>
          <a href="https://www.facebook.com/plovejapan" target="_blank" rel="noreferrer"><Facebook size={17} /> Facebook</a>
        </div>
        <p className="footer-note">© 2026 ABE · P LOVE JAPAN / PPBAG</p>
      </footer>
    </main>
  );
}
