import HomeBannerExtraArtwork from './HomeBannerExtraArtwork'

export default function HomeBannerArtwork({ kind }) {
  return (
    <svg className="home-side-banner__art" viewBox="0 0 180 112" aria-hidden="true" focusable="false">
      <ellipse cx="91" cy="102" rx="66" ry="7" fill="currentColor" opacity=".1" />
      <HomeBannerExtraArtwork kind={kind} />
      {kind === 'store' && (
        <g>
          <path d="M43 39h88l-8 62H50z" fill="#d9a967" />
          <path d="M62 43V27c0-26 47-26 47 0v16" fill="none" stroke="#52754d" strokeWidth="6" />
          <path d="M84 35C58 28 61 9 63 5c19 0 27 12 21 30" fill="#86a561" />
          <path d="M88 35C92 11 111 12 120 14c-1 17-13 23-32 21" fill="#426946" />
          <path d="M37 57c-19-15-32 1-20 23 11 21 35 14 36-5 2-15-7-22-16-18" fill="#d96a44" />
          <path d="m37 58 3-17" stroke="#365b39" strokeWidth="4" />
          <rect x="123" y="52" width="29" height="48" rx="3" fill="#faf4e3" />
          <path d="m123 52 6-14h17l6 14" fill="#8fa989" />
          <path d="M130 65h15v22h-15z" fill="#426b51" />
          <text x="87" y="80" textAnchor="middle" fill="#305b40" fontSize="19" fontWeight="900">store.</text>
        </g>
      )}
      {kind === 'member' && (
        <g>
          <circle cx="90" cy="53" r="47" fill="#bcd9b6" opacity=".13" />
          <path d="m52 36 17-17h42l18 17-39 60z" fill="#edbf66" />
          <path d="m52 36 38 9 39-9-39 60z" fill="#f6d99c" />
          <path d="m69 19 21 26 21-26M52 36h77M90 45v51" stroke="#ab7836" strokeWidth="2" fill="none" />
          <path d="m30 27 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#edbf66" />
          <path d="m147 63 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#edbf66" />
        </g>
      )}
      {kind === 'tech' && (
        <g>
          <circle cx="97" cy="54" r="46" fill="#a1c6ef" opacity=".25" />
          <rect x="36" y="18" width="113" height="73" rx="7" fill="#213e63" />
          <rect x="42" y="24" width="101" height="59" rx="3" fill="#83b4e2" />
          <path d="m42 73 46-49h32L68 83H42z" fill="#c3dff7" />
          <path d="m109 24-28 59h62V24z" fill="#4274b1" />
          <path d="M36 89h113l21 13H16z" fill="#a6bbce" />
          <path d="M16 102h154l-8 5H24z" fill="#506d8a" />
          <path d="M76 91h35l6 6H70z" fill="#738da8" />
        </g>
      )}
      {kind === 'home' && (
        <g>
          <circle cx="90" cy="57" r="45" fill="#edc580" opacity=".3" />
          <path d="M38 42h66v43c0 11-11 17-33 17S38 96 38 85z" fill="#f8ead0" />
          <path d="M39 45h66M51 37h42l9 8H42z" stroke="#a97041" strokeWidth="4" fill="#d7a666" />
          <path d="M61 28h21v10H61z" fill="#637c58" />
          <path d="M38 54H27v22h11M104 54h11v22h-11" stroke="#637c58" strokeWidth="6" fill="none" />
          <rect x="56" y="69" width="31" height="16" rx="6" fill="#a9b294" />
          <circle cx="72" cy="77" r="4" fill="#456547" />
          <path d="M124 56h27v37c0 12-27 12-27 0z" fill="#c88355" />
          <path d="M151 64h7c13 0 13 24-7 24" fill="none" stroke="#c88355" strokeWidth="5" />
          <ellipse cx="138" cy="57" rx="14" ry="4" fill="#f0cda0" />
        </g>
      )}
      {kind === 'wheel' && (
        <g>
          <path d="m76 85-8 19h45l-9-19" fill="#547956" />
          <circle cx="90" cy="53" r="43" fill="#fff0c7" stroke="#bc8941" strokeWidth="5" />
          <path d="M90 53V13a40 40 0 0 1 35 20zM90 53l35 20a40 40 0 0 1-35 20z" fill="#dc9e3f" />
          <path d="m90 53-35 20a40 40 0 0 1 0-40z" fill="#dc9e3f" />
          <path d="m90 53 35-20M90 53l35 20M90 53v40M90 53 55 73M90 53 55 33M90 53V13"
            stroke="#fff6de" strokeWidth="2" />
          <circle cx="90" cy="53" r="12" fill="#43684b" />
          <path d="m83 51 5 5 9-10" fill="none" stroke="#fff0c7" strokeWidth="3" />
          <path d="m82 5 8 18 8-18z" fill="#43684b" />
          <path d="M23 69h22v25H23z" fill="#e3b362" />
          <path d="M20 65h28v8H20zM31 66h6v28" fill="#587752" />
        </g>
      )}
      {kind === 'shipping' && (
        <g>
          <circle cx="91" cy="52" r="44" fill="#b7cdae" opacity=".3" />
          <path d="M22 42h79v47H22z" fill="#5d8364" />
          <path d="M101 57h28l25 20v12h-53z" fill="#9fb99a" />
          <path d="M109 62h17l15 14h-32z" fill="#f5edda" />
          <circle cx="45" cy="90" r="11" fill="#314c39" />
          <circle cx="129" cy="90" r="11" fill="#314c39" />
          <circle cx="45" cy="90" r="4" fill="#e9e5d3" />
          <circle cx="129" cy="90" r="4" fill="#e9e5d3" />
          <path d="M38 17h67v9a7 7 0 0 0 0 14v9H38v-9a7 7 0 0 0 0-14z" fill="#e5bc73" />
          <path d="M85 21v24" stroke="#916a35" strokeWidth="2" strokeDasharray="3 3" />
          <path d="m51 33 7 6 13-14" fill="none" stroke="#6f552f" strokeWidth="4" />
        </g>
      )}
    </svg>
  )
}
