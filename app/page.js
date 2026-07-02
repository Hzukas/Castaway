export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d1f2d',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} xmlns="http://www.w3.org/2000/svg">
        {[0,1,2,3,4,5,6,7,8].map(i=>(
          <line key={`h${i}`} x1="0" y1={`${i*12.5}%`} x2="100%" y2={`${i*12.5}%`} stroke="#378ADD" strokeWidth="0.5" strokeOpacity={i%2===0?0.12:0.06}/>
        ))}
        {[0,1,2,3,4,5,6,7,8,9,10].map(i=>(
          <line key={`v${i}`} x1={`${i*10}%`} y1="0" x2={`${i*10}%`} y2="100%" stroke="#378ADD" strokeWidth="0.5" strokeOpacity="0.06"/>
        ))}
        <path d="M 80,400 Q 400,-100 800,300" stroke="#FFD166" strokeWidth="1.5" strokeDasharray="6 6" fill="none" strokeOpacity="0.6"/>
        <path d="M 100,600 Q 500,100 1200,400" stroke="#1D9E75" strokeWidth="1" strokeDasharray="5 7" fill="none" strokeOpacity="0.4"/>
        <path d="M 300,800 Q 700,200 1400,500" stroke="#7F77DD" strokeWidth="1" strokeDasharray="4 8" fill="none" strokeOpacity="0.35"/>
        <circle cx="80" cy="400" r="4" fill="#FFD166" fillOpacity="0.8"/>
        <circle cx="800" cy="300" r="4" fill="#FFD166" fillOpacity="0.8"/>
        <circle cx="100" cy="600" r="3" fill="#1D9E75" fillOpacity="0.7"/>
        <circle cx="1200" cy="400" r="3" fill="#1D9E75" fillOpacity="0.7"/>
      </svg>

      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'2rem'}}>
        <div style={{
          fontSize:'13px',fontWeight:600,letterSpacing:'0.15em',
          color:'#FFD166',textTransform:'uppercase',marginBottom:'16px',
        }}>Find your island. Together.</div>

        <h1 style={{
          fontSize:'clamp(48px, 8vw, 96px)',fontWeight:700,
          color:'#ffffff',margin:'0 0 8px',letterSpacing:'-2px',lineHeight:1,
        }}>Castaway</h1>

        <p style={{
          fontSize:'18px',color:'rgba(255,255,255,0.45)',
          margin:'16px 0 40px',maxWidth:'420px',
        }}>Dream it. Pitch it. Go.</p>

        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
          <a href="/auth" style={{
            background:'#FFD166',color:'#1a0e00',border:'none',
            borderRadius:'10px',padding:'14px 32px',fontSize:'15px',
            fontWeight:700,cursor:'pointer',textDecoration:'none',
          }}>Start a group</a>
          <a href="#how" style={{
            background:'transparent',color:'rgba(255,255,255,0.7)',
            border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',
            padding:'14px 32px',fontSize:'15px',fontWeight:600,
            cursor:'pointer',textDecoration:'none',
          }}>See how it works</a>
        </div>
      </div>
    </main>
  )
}