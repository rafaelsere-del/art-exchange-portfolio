export default function ArtSVG({ artwork, width = 300, height = 240 }) {
  const { color1, color2, shape, id } = artwork;
  const uid = `g${id}${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${uid})`} />
      {shape === "lines" && [60,100,150,200,240].map((x,i) => (
        <rect key={i} x={x} y={10} width={4} height={height-20} fill="rgba(255,255,255,0.15)" />
      ))}
      {shape === "triangle" && <>
        <polygon points={`${width/2},20 ${width-20},${height-20} 20,${height-20}`} fill="rgba(255,255,255,0.08)" />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.3} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      </>}
      {shape === "blocks" && [[30,30,80,height*0.5],[130,50,100,80],[150,80,60,80]].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.08)" rx={1} />
      ))}
      {shape === "circle" && <>
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.38} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.22} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.1} fill="rgba(255,255,255,0.08)" />
      </>}
      {shape === "grid" && Array.from({length:4}).flatMap((_,i) => Array.from({length:3}).map((_,j) => (
        <rect key={`${i}-${j}`} x={20+i*70} y={20+j*70} width={55} height={55} fill="rgba(255,255,255,0.06)" rx={2} />
      )))}
      {shape === "waves" && [0,1,2,3].map(i => (
        <path key={i} d={`M0,${height*0.3+i*35} Q${width/4},${height*0.2+i*35} ${width/2},${height*0.3+i*35} T${width},${height*0.3+i*35}`}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}
