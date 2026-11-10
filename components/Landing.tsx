'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, CirclePlay, Command, Cpu, Layers3, Menu, Minus, MoveUpRight, MousePointer2, Pause, Play, Plus, RotateCcw, Send, SlidersHorizontal, Sparkles, WandSparkles, X } from 'lucide-react';
import type { Mode, Parameters } from './ParametricScene';

const Scene = dynamic(() => import('./ParametricScene'), { ssr: false, loading: () => <div className="scene-loading">Initializing 3D workspace<span>· · ·</span></div> });
const initial: Parameters = { floors: 20, twist: 3, density: 70, curve: 40 };
const modes: { id: Mode, title: string, tagline: string, prompt: string, index: string }[] = [
  { id:'tower', title:'Twisting tower', tagline:'A skyline in motion.', prompt:'Create a 20-story twisting tower', index:'01' },
  { id:'facade', title:'Adaptive facade', tagline:'Patterns with purpose.', prompt:'Design a diamond-pattern facade', index:'02' },
  { id:'pavilion', title:'Organic pavilion', tagline:'Where structure flows.', prompt:'Generate an organic ribbed pavilion', index:'03' },
  { id:'roof', title:'Generative roof', tagline:'Engineered to evolve.', prompt:'Create a flowing parametric roof', index:'04' },
];
const demoSteps = [
  { text:'Create a 20-story tower', params: { floors:20, twist:0, density:38, curve:40 }, info:'20 floors generated' },
  { text:'Twist each floor by 5 degrees', params: { floors:20, twist:5, density:38, curve:40 }, info:'Rotation updated: 5° / floor' },
  { text:'Add a detailed geometric facade', params: { floors:20, twist:5, density:88, curve:40 }, info:'Facade density updated' },
  { text:'Make it 30 stories', params: { floors:30, twist:5, density:88, curve:40 }, info:'30 floors generated' },
];

function Brand() { return <Link href="/" className="logo" aria-label="Forma homepage"><span className="brand-mark"><i/><i/><i/></span>FORMA<span className="logoDot">.</span></Link>; }
function ScrollTo({ target, children, className='' }: { target:string;children:React.ReactNode;className?:string }) {
  return <a className={className} href={`#${target}`}>{children}</a>;
}
function SectionLabel({ index, children }: { index:string;children:React.ReactNode }) { return <div className="section-label"><span className="label-index">{index}</span><span className="label-line"/><span>{children}</span></div> }

export default function Landing() {
  const [mode,setMode]=useState<Mode>('tower');
  const [params,setParams]=useState<Parameters>(initial);
  const [demoIndex,setDemoIndex]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [prompt,setPrompt]=useState('');
  const [lastPrompt,setLastPrompt]=useState('Create a 20-story twisting tower');
  const [notice,setNotice]=useState('PREVIEW READY');
  const [reducedMotion,setReducedMotion]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [form,setForm]=useState({name:'',email:'',role:'',interest:'',website:''});
  const [formState,setFormState]=useState<'idle'|'loading'|'success'|'error'>('idle');
  const [formError,setFormError]=useState('');
  const lastStepTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');setReducedMotion(mq.matches);const listener=()=>setReducedMotion(mq.matches);mq.addEventListener('change',listener);return()=>mq.removeEventListener('change',listener)},[]);
  useEffect(()=>{
    if(!playing)return;
    const timeout=setTimeout(()=>{
      setDemoIndex(prev=>{
        const next=(prev+1)%demoSteps.length;
        setParams(demoSteps[next].params);
        setLastPrompt(demoSteps[next].text);
        setNotice(demoSteps[next].info.toUpperCase());
        return next;
      });
    },demoIndex===-1?450:2400);
    return()=>clearTimeout(timeout);
  },[playing,demoIndex]);
  useEffect(()=>()=>{if(lastStepTimer.current)clearTimeout(lastStepTimer.current)},[]);

  const chooseMode=(target:Mode)=>{
    setPlaying(false);setDemoIndex(-1);setMode(target);setParams(initial);
    const entry=modes.find(m=>m.id===target)!;
    setLastPrompt(entry.prompt);setNotice(`SCENE / ${entry.title.toUpperCase()}`);
  };
  const startDemo=()=>{setMode('tower');setDemoIndex(-1);setPlaying(true);document.getElementById('workspace')?.scrollIntoView({behavior:'smooth',block:'center'});};
  const sendPrompt=()=>{
    const value=prompt.trim();if(!value)return;
    setPlaying(false);
    const lower=value.toLowerCase();let changed=false;
    const number=lower.match(/\b(\d{1,2})\s*(?:story|stories|floors?)\b/);
    const degree=lower.match(/\b(\d{1,2})\s*(?:°|degrees?)\b/);
    if(lower.includes('tower')||lower.includes('building')){setMode('tower');changed=true;}
    if(lower.includes('facade')||lower.includes('façade')){setMode('facade');changed=true;}
    if(lower.includes('pavilion')){setMode('pavilion');changed=true;}
    if(lower.includes('roof')){setMode('roof');changed=true;}
    if(number){setParams(p=>({...p,floors:Math.max(8,Math.min(45,Number(number[1])))}));changed=true;}
    if(degree){setParams(p=>({...p,twist:Math.max(0,Math.min(12,Number(degree[1])))}));changed=true;}
    if(lower.includes('taller')||lower.includes('higher')){setParams(p=>({...p,floors:Math.min(45,p.floors+5)}));changed=true;}
    if(lower.includes('shorter')){setParams(p=>({...p,floors:Math.max(8,p.floors-5)}));changed=true;}
    if(lower.includes('more twist')||lower.includes('twist more')){setParams(p=>({...p,twist:Math.min(12,p.twist+2)}));changed=true;}
    if(lower.includes('more detail')||lower.includes('denser')){setParams(p=>({...p,density:Math.min(100,p.density+20)}));changed=true;}
    setLastPrompt(value);setPrompt('');
    setNotice(changed?'DEMO PARAMETERS UPDATED':'EXPERIMENTAL REQUEST · JOIN EARLY ACCESS');
  };
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setFormState('loading');setFormError('');
    try{
      const res=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const json=await res.json();if(!res.ok)throw new Error(json.error||'Unable to submit.');setFormState('success');
    }catch(e){setFormState('error');setFormError(e instanceof Error?e.message:'Please try again.');}
  };
  return <>
    <div className="site-shell">
      <header className="header">
        <Brand/>
        <nav className={mobileOpen?'nav nav-open':'nav'} aria-label="Main navigation">
          <ScrollTo target="workspace" className="nav-link">The experience</ScrollTo>
          <ScrollTo target="how-it-works" className="nav-link">How it works</ScrollTo>
          <ScrollTo target="possibilities" className="nav-link">Possibilities</ScrollTo>
          <ScrollTo target="early-access" className="nav-mobile-cta">Get early access <ArrowUpRight size={16}/></ScrollTo>
        </nav>
        <ScrollTo target="early-access" className="header-cta">Join waitlist <ArrowUpRight size={15}/></ScrollTo>
        <button className="mobile-menu" aria-label={mobileOpen?'Close menu':'Open menu'} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-noise"/>
          <div className="hero-grid"/>
          <div className="hero-glow"/>
          <div className="hero-model"><Scene mode="tower" params={params} motion={!reducedMotion}/></div>
          <div className="hero-left">
            <div className="hero-tag"><span className="live-dot"/> INTRODUCING A NEW DIMENSION OF DESIGN <ArrowUpRight size={12}/></div>
            <h1>Your imagination.<br/><em>Now executable.</em></h1>
            <p className="hero-sub">The space between an idea and a 3D model is disappearing. Create and transform parametric architecture with a conversation.</p>
            <div className="hero-actions"><ScrollTo target="early-access" className="btn btn-primary">Get early access <ArrowUpRight size={18}/></ScrollTo><button className="btn btn-ghost" onClick={startDemo}><CirclePlay size={20}/> Watch it work</button></div>
            <div className="hero-proof"><span className="mini-symbol">✳</span><span>Built for the next generation of<br/><strong>architects, engineers & designers.</strong></span></div>
          </div>
          <div className="hero-floating-chat">
            <div className="floating-chat-top"><span className="chat-ai-glyph">✳</span><span>Design assistant</span><span className="chat-online">● ONLINE</span></div>
            <div className="floating-bubble">Make this tower twist 5° per floor <span className="bubble-arrow">↗</span></div>
            <div className="floating-result"><span>✳</span> Parametric geometry updated <Check size={13}/></div>
          </div>
          <div className="hero-coordinates"><span>FIG 001 / PARAMETRIC INTELLIGENCE</span><span>40° 43′ 55″ N — INFINITE POSSIBILITIES</span></div>
          <a href="#workspace" className="hero-scroll">SCROLL TO EXPLORE <ArrowDownRight size={17}/></a>
        </section>

        <section className="marquee-strip" aria-label="Product principles"><div className="marquee-inner"><span>WORDS INTO WORLDS</span><b>✳</b><span>DESIGN WITHOUT FRICTION</span><b>✳</b><span>PARAMETRIC BY NATURE</span><b>✳</b><span>ITERATION AT THE SPEED OF THOUGHT</span><b>✳</b><span>WORDS INTO WORLDS</span></div></section>

        <section className="workspace-section section-pad" id="workspace">
          <SectionLabel index="01" >THE INTERACTIVE PREVIEW</SectionLabel>
          <div className="section-heading-row"><div><h2>Don't just imagine it.<br/><span>Tell it what to become.</span></h2></div><p>Explore a working 3D concept preview. Change the architecture, adjust the parameters, see the design respond.</p></div>
          <div className="workspace-app">
            <div className="workspace-toolbar"><div className="window-controls"><i/><i/><i/></div><span className="workspace-project"><span className="toolbar-logo">◈</span> untitled-concept.gh <span className="demo-chip">INTERACTIVE CONCEPT</span></span><span className="toolbar-right"><span className="toolbar-saved"><span/> Preview mode</span><Command size={16}/></span></div>
            <div className="workspace-content">
              <div className="workspace-sidebar">
                <div className="side-eyebrow">EXPLORE / 4 CONCEPTS</div>
                <div className="model-list">{modes.map(m=><button key={m.id} onClick={()=>chooseMode(m.id)} className={`model-item ${mode===m.id?'active':''}`}><span className="model-index">{m.index}</span><span><strong>{m.title}</strong><small>{m.tagline}</small></span><ChevronRight size={16}/></button>)}</div>
                <div className="sidebar-divider"/>
                <div className="side-eyebrow parameter-label"><SlidersHorizontal size={14}/> LIVE PARAMETERS</div>
                {mode==='tower'&&<><Range name="Floors" value={params.floors} min={8} max={45} unit="" onChange={v=>setParams(p=>({...p,floors:v}))}/><Range name="Rotation" value={params.twist} min={0} max={12} unit="°" onChange={v=>setParams(p=>({...p,twist:v}))}/></>}
                <Range name="Detail" value={params.density} min={20} max={100} unit="%" onChange={v=>setParams(p=>({...p,density:v}))}/>
                {(mode==='pavilion'||mode==='roof')&&<Range name="Curvature" value={params.curve} min={0} max={100} unit="%" onChange={v=>setParams(p=>({...p,curve:v}))}/>}
                <div className="sidebar-bottom"><span className="status-dot"/> GEOMETRY ENGINE ACTIVE <span>↗</span></div>
              </div>
              <div className="workspace-viewport">
                <div className="viewport-top"><div><span className="viewport-lens">PERSPECTIVE / SHADED</span><span className="viewport-descr">{modes.find(m=>m.id===mode)?.title}</span></div><button className="reset-button" onClick={()=>{setParams(initial);setPlaying(false);setDemoIndex(-1);setNotice('VIEW RESET')}} title="Reset scene"><RotateCcw size={15}/></button></div>
                <div className="viewport-model"><Scene mode={mode} params={params} compact motion={!reducedMotion}/></div>
                <div className="viewport-mark"><span className="viewport-cross">✳</span> FORMA / GENERATIVE DESIGN ENGINE</div>
                <div className="viewport-bottom"><span><span className="viewport-green"/> {notice}</span><span>DRAG TO ROTATE <MousePointer2 size={13}/></span></div>
              </div>
              <div className="workspace-chat">
                <div className="assistant-heading"><span className="assistant-avatar">✳</span><span><strong>Design assistant</strong><small>CONCEPT DEMONSTRATION</small></span><span className="assistant-bolt">✦</span></div>
                <div className="chat-thread"><div className="chat-system">A new world starts with a prompt.</div><div className="chat-user">{lastPrompt}</div><div className="chat-agent"><span className="agent-icon">✳</span><div><strong>{notice.includes('EXPERIMENTAL')?'Beyond this demo':'Preview updated.'}</strong><p>{notice.includes('EXPERIMENTAL')?'The full natural-language AI experience is coming. Join early access to try it.':'Your geometry is interactive. Change a parameter or try a new instruction.'}</p><div className="chat-task"><Check size={13}/> {mode.toUpperCase()} · PARAMETRIC</div></div></div></div>
                <div className="example-commands"><div className="examples-title">TRY A COMMAND</div>{['Make it 30 stories','Twist 8 degrees','Create an organic pavilion'].map(s=><button key={s} onClick={()=>{setPrompt(s);}}>{s}<ArrowUpRight size={12}/></button>)}</div>
                <div className="chat-compose"><label className="sr-only" htmlFor="design-prompt">Design prompt</label><input id="design-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendPrompt()} placeholder="Describe a change..."/><button aria-label="Send prompt" onClick={sendPrompt}><ArrowRight size={18}/></button></div>
                <div className="demo-disclaimer">Guided interactive preview · Not connected to live Grasshopper AI</div>
              </div>
            </div>
            <div className="workspace-footer"><span>01 / EXPLORE THE POSSIBILITIES</span><button onClick={playing?()=>setPlaying(false):startDemo}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause guided demo':'Play guided demo'}</button><span>ALL GEOMETRY RENDERED IN 3D</span></div>
          </div>
        </section>

        <section className="statement-section"><span className="giant-star">✳</span><div className="statement-content"><span className="overline">A NEW CREATIVE LANGUAGE</span><h2>Less time connecting nodes.<br/><em>More time connecting ideas.</em></h2><p>Parametric design has always been powerful. We believe it should be intuitive, too.</p></div></section>

        <section className="how-section section-pad" id="how-it-works"><SectionLabel index="02">THE PROCESS</SectionLabel><div className="section-heading-row"><h2>From words<br/><span>to geometry.</span></h2><p>No complex setup to imagine your next design. A conversation can become the starting point for a whole new structure.</p></div><div className="steps-grid"><ProcessStep n="01" icon={<WandSparkles size={25}/>} title="Describe" text="Start with an idea, an instruction, or a question. Your intent is the interface." visual={<div className="step-prompt"><span>↗ NEW INSTRUCTION</span>“Create a fluid, curved pavilion with a ribbed structure.”<i>↵</i></div>}/><ProcessStep n="02" icon={<Cpu size={25}/>} title="Generate" text="AI plans parametric operations and connects them to the modeling engine." visual={<div className="step-nodes"><div>CURVE <small>01</small></div><i/><div>LOFT <small>02</small></div><i/><div>GEOMETRY <small>03</small></div></div>}/><ProcessStep n="03" icon={<Layers3 size={25}/>} title="Refine" text="Change your mind. Ask for new shapes, proportions or constraints. Keep creating." visual={<div className="step-refine"><span>HEIGHT</span><div><i style={{width:'75%'}}/></div><span>CURVATURE</span><div><i style={{width:'55%'}}/></div><span>DENSITY</span><div><i style={{width:'88%'}}/></div></div>}/></div></section>

        <section className="possibilities-section section-pad" id="possibilities"><SectionLabel index="03">A NEW DESIGN SPACE</SectionLabel><div className="section-heading-row"><h2>A world of forms.<br/><span>One conversation.</span></h2><p>From impossible facades to structures that move with your thinking. One interface. Endless directions.</p></div><div className="possibilities-gallery"><GalleryCard number="001" title="Architecture, reimagined" desc="Sculpt skylines from a sentence." kind="tower" onClick={()=>{chooseMode('tower');document.getElementById('workspace')?.scrollIntoView({behavior:'smooth'})}}/><GalleryCard number="002" title="Systems that evolve" desc="Make every surface a design opportunity." kind="facade" onClick={()=>{chooseMode('facade');document.getElementById('workspace')?.scrollIntoView({behavior:'smooth'})}}/><GalleryCard number="003" title="Form follows imagination" desc="Explore geometric ideas without friction." kind="pavilion" onClick={()=>{chooseMode('pavilion');document.getElementById('workspace')?.scrollIntoView({behavior:'smooth'})}}/></div></section>

        <section className="audience-section"><div className="audience-inner"><div><span className="overline">WHO IT'S FOR</span><h2>Designed for<br/><em>the designers.</em></h2></div><div className="audience-list"><div><span>01</span><strong>Architects</strong><ArrowUpRight size={19}/></div><div><span>02</span><strong>Computational designers</strong><ArrowUpRight size={19}/></div><div><span>03</span><strong>Engineers</strong><ArrowUpRight size={19}/></div></div></div></section>

        <section className="signup-section section-pad" id="early-access"><div className="signup-aura"/><div className="signup-left"><SectionLabel index="04">EARLY ACCESS</SectionLabel><div className="signup-decoration">✳</div><h2>The future takes<br/><em>shape here.</em></h2><p>The next chapter of computational design is beginning. Be among the first to explore it.</p><div className="signup-tags"><span>EARLY ACCESS UPDATES</span><span>NO SPAM. JUST IDEAS.</span></div></div><div className="signup-card">{formState==='success'?<div className="success-state"><div className="success-icon"><Check size={34}/></div><h3>You're on the list.</h3><p>Thanks for joining. We'll be in touch when early access opens.</p><button onClick={()=>{setFormState('idle');setForm({name:'',email:'',role:'',interest:'',website:''})}}>Add another person <ArrowUpRight size={16}/></button></div>:<><div className="signup-card-top"><span>REQUEST AN INVITE</span><span>✳ 001</span></div><h3>Get first access.</h3><p>Tell us a little about yourself.</p><form onSubmit={submit} className="signup-form"><div className="field-row"><label>YOUR NAME<input required minLength={2} placeholder="Alex Morgan" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></label><label>WORK EMAIL<input required type="email" placeholder="alex@studio.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></label></div><label>WHAT BEST DESCRIBES YOU?<div className="select-wrap"><select required value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="">Select your role</option><option>Architect</option><option>Computational designer</option><option>Engineer</option><option>Student</option><option>Other</option></select><ChevronDown size={16}/></div></label><label>WHAT WOULD YOU LOVE TO CREATE? <span>(OPTIONAL)</span><textarea placeholder="Tell us what you imagine..." rows={3} value={form.interest} onChange={e=>setForm(f=>({...f,interest:e.target.value}))}/></label><div className="hidden-field"><label>Website<input autoComplete="off" tabIndex={-1} value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))}/></label></div>{formState==='error'&&<div className="form-error" role="alert">{formError}</div>}<button type="submit" className="signup-submit" disabled={formState==='loading'}>{formState==='loading'?'Submitting...':'Join early access'} <ArrowUpRight size={19}/></button><div className="form-footnote">By joining, you agree to receive early-access communications. <Link href="/privacy">Privacy policy</Link>.</div></form></>}</div></section>
      </main>
      <footer className="footer"><div className="footer-top"><Brand/><span>A new dimension of design.</span><a href="#top" className="back-top">BACK TO TOP ↑</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} FORMA. CONCEPT PRODUCT.</span><div><Link href="/privacy">PRIVACY</Link><Link href="/terms">TERMS</Link><a href="mailto:hello@example.com" title="Replace with your real contact address before launch">CONTACT</a></div><span>DESIGNED FOR WHAT'S NEXT ↗</span></div></footer>
    </div>
  </>;
}

function Range({name,value,min,max,unit,onChange}:{name:string;value:number;min:number;max:number;unit:string;onChange:(n:number)=>void}){
  return <div className="range-control"><div><label>{name}</label><span>{value}{unit}</span></div><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} style={{'--range-progress': `${((value-min)/(max-min))*100}%`} as React.CSSProperties}/></div>;
}
function ProcessStep({n,icon,title,text,visual}:{n:string;icon:React.ReactNode;title:string;text:string;visual:React.ReactNode}){return <article className="process-card"><div className="process-card-top"><span>STEP / {n}</span>{icon}</div><div className="process-visual">{visual}</div><div className="process-card-bottom"><h3>{title}<span>.</span></h3><p>{text}</p></div></article>}
function GalleryCard({number,title,desc,kind,onClick}:{number:string;title:string;desc:string;kind:Mode;onClick:()=>void}){return <button className={`gallery-card gallery-${kind}`} onClick={onClick}><div className="gallery-scene"><Scene mode={kind} params={{floors:28,twist:5,density:75,curve:60}} compact motion={false}/></div><div className="gallery-meta"><span>{number} / FORM STUDY</span><ArrowUpRight size={19}/></div><div className="gallery-copy"><h3>{title}</h3><p>{desc}</p></div></button>}
