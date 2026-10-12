export default function HomeBannerExtraArtwork({ kind }) {
  return (
    <g>
      {kind === 'electronics' && (
        <g>
          <circle cx="94" cy="53" r="45" fill="#86bdcb" opacity=".25" />
          <rect x="49" y="12" width="57" height="91" rx="10" fill="#304f63" />
          <rect x="55" y="21" width="45" height="70" rx="4" fill="#9edbd8" />
          <path d="m55 74 45-41v33L72 91H55z" fill="#e1f6ec" />
          <path d="M121 48c-13 0-13 22 0 22h9V48zM151 48c13 0 13 22 0 22h-9V48z" fill="#e8bc7e" />
          <path d="M121 48v-7c0-20 30-20 30 0v7" fill="none" stroke="#4d8291" strokeWidth="7" />
          <circle cx="78" cy="97" r="3" fill="#c1e1e6" />
        </g>
      )}
      {kind === 'fashion' && (
        <g>
          <circle cx="90" cy="55" r="45" fill="#d9aac1" opacity=".3" />
          <path d="m63 24-29 21 16 23 14-9v43h54V59l14 9 16-23-30-21z" fill="#b66c8f" />
          <path d="M74 24c0 21 34 21 34 0" fill="#f7dfd4" />
          <path d="M74 24c0 21 34 21 34 0M71 88h40" fill="none" stroke="#874668" strokeWidth="4" />
          <path d="m84 58 7-9 7 9-7 9z" fill="#f1c894" />
        </g>
      )}
      {kind === 'jewelry' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#e8c58b" opacity=".3" />
          <path d="M53 15c-9 38 9 66 37 67s45-28 38-67" fill="none" stroke="#bd8b40" strokeWidth="5" />
          <path d="m75 80 15-14 15 14-15 24z" fill="#77a7a4" stroke="#bd8b40" strokeWidth="3" />
          <path d="m75 80 15 5 15-5M90 66v38" fill="none" stroke="#d7ebd9" strokeWidth="2" />
          <circle cx="32" cy="53" r="9" fill="none" stroke="#bd8b40" strokeWidth="4" />
          <circle cx="150" cy="53" r="9" fill="none" stroke="#bd8b40" strokeWidth="4" />
          <path d="m143 12 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#e1b35e" />
        </g>
      )}
      {kind === 'components' && (
        <g>
          <circle cx="89" cy="57" r="44" fill="#b4b9da" opacity=".3" />
          <rect x="43" y="38" width="55" height="50" rx="9" fill="#7184ab" />
          <path d="M57 38V23M84 38V23" stroke="#c4d2e2" strokeWidth="7" />
          <path d="M70 88v8c0 15 56 15 56-7V70" fill="none" stroke="#435a82" strokeWidth="6" />
          <rect x="116" y="46" width="20" height="27" rx="4" fill="#7184ab" />
          <path d="M121 46V34h10v12" fill="#c4d2e2" />
          <path d="m72 48-11 16h11l-4 15 13-21H69z" fill="#e7ddbb" />
        </g>
      )}
      {kind === 'beauty' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#e4b8ba" opacity=".3" />
          <rect x="45" y="36" width="50" height="65" rx="10" fill="#c58d9b" />
          <path d="M56 36V21h28v15M67 21V12h26" fill="none" stroke="#805c75" strokeWidth="7" />
          <rect x="52" y="56" width="36" height="26" rx="3" fill="#f6e5d5" />
          <path d="M70 60c-14 13-9 18 0 18s13-7 0-18" fill="#92aa83" />
          <path d="m109 42 31 4-5 51h-23z" fill="#e6bf8e" />
          <path d="M111 92h25v10h-25z" fill="#805c75" />
        </g>
      )}
      {kind === 'design' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#b8cfa8" opacity=".3" />
          <path d="M41 20h82v81H41z" fill="#f5edd8" stroke="#96ae8d" strokeWidth="3" />
          <path d="M51 35h31M51 43h47M51 88h41" stroke="#aec0a0" strokeWidth="4" />
          <path d="m54 77 15-20 17 10 17-14v24z" fill="#8aaa87" />
          <path d="m103 83 29-56 12 6-29 56-15 14z" fill="#dcad64" />
          <path d="m100 103 3-20 12 6z" fill="#48684d" />
          <path d="m132 27 5-10 12 6-5 10z" fill="#c98578" />
        </g>
      )}
      {kind === 'popular' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#e9c27f" opacity=".3" />
          <path d="m90 15 12 25 28 4-20 20 5 28-25-13-25 13 5-28-20-20 28-4z" fill="#d7a550" />
          <path d="m90 30 7 17 19 2-14 13 4 18-16-9-16 9 4-18-14-13 19-2z" fill="#f8df9b" />
          <path d="m32 34 7 5M145 34l-7 5M31 81l9-3M149 81l-9-3" stroke="#b5823d" strokeWidth="4" />
        </g>
      )}
      {kind === 'favorites' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#e4b4bd" opacity=".3" />
          <path d="M90 96 45 53C16 20 66-5 90 30c24-35 74-10 45 23z" fill="#be7189" />
          <path d="M50 35c8-8 18-7 25 0" fill="none" stroke="#efc6ce" strokeWidth="6" strokeLinecap="round" />
          <path d="m128 72 6 12 13 2-10 9 2 13-11-6-12 6 3-13-10-9 13-2z" fill="#eac484" />
        </g>
      )}
      {kind === 'orders' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#afc6d7" opacity=".3" />
          <path d="M49 12h76v93l-10-6-9 6-10-6-9 6-9-6-10 6-10-6-9 6z" fill="#f4eddc" />
          <path d="M63 31h48M63 43h33M63 57h42M63 71h25" stroke="#7795ab" strokeWidth="5" />
          <circle cx="123" cy="78" r="22" fill="#6c9580" />
          <path d="m113 78 7 7 14-17" stroke="#edf3de" strokeWidth="5" fill="none" />
        </g>
      )}
      {kind === 'wallet' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#b7cbb1" opacity=".3" />
          <path d="m44 37 77-23 11 42-88 22z" fill="#d7b674" />
          <rect x="35" y="39" width="108" height="59" rx="10" fill="#719075" />
          <path d="M123 56h25v25h-25c-17 0-17-25 0-25" fill="#c2d3b3" />
          <circle cx="127" cy="69" r="4" fill="#48644b" />
          <path d="M48 53h44" stroke="#c2d3b3" strokeWidth="4" />
        </g>
      )}
      {kind === 'sale' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#e8ba92" opacity=".3" />
          <path d="m43 37 44-22 58 55-42 35-60-54z" fill="#cd925e" />
          <circle cx="61" cy="41" r="6" fill="#f6e5c8" />
          <path d="M60 41C22 9 26 4 61 15" stroke="#6e8662" strokeWidth="4" fill="none" />
          <path d="m83 76 31-19" stroke="#fff0d3" strokeWidth="5" />
          <circle cx="86" cy="54" r="6" fill="none" stroke="#fff0d3" strokeWidth="4" />
          <circle cx="112" cy="80" r="6" fill="none" stroke="#fff0d3" strokeWidth="4" />
        </g>
      )}
      {kind === 'contact' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#b9c7d6" opacity=".3" />
          <path d="M49 45h84v57H49z" fill="#d9bb8e" />
          <path d="m39 45 10-23h84l10 23z" fill="#6c8e9a" />
          <path d="M60 22v23M82 22v23M105 22v23M127 22v23" stroke="#e1e8d6" strokeWidth="9" />
          <path d="M61 59h23v26H61zM97 59h24v43H97z" fill="#517383" />
          <path d="M145 21c-22 0-22 25 0 42 22-17 22-42 0-42" fill="#bf7962" />
          <circle cx="145" cy="36" r="6" fill="#f6dfc4" />
        </g>
      )}
      {kind === 'cart' && (
        <g>
          <circle cx="90" cy="54" r="45" fill="#b6cdb0" opacity=".3" />
          <path d="M31 26h15l14 58h70l15-44H51" fill="#a9be99" stroke="#557557" strokeWidth="5" />
          <path d="M75 43v29M98 43v29M122 43l-4 29M58 59h77" stroke="#eaf0d9" strokeWidth="4" />
          <circle cx="71" cy="97" r="8" fill="#47624b" />
          <circle cx="124" cy="97" r="8" fill="#47624b" />
          <path d="m77 39 2-24 28 2-2 23" fill="#dfba78" />
          <path d="M86 17v-6c0-10 14-10 14 0v7" stroke="#9a794b" strokeWidth="3" fill="none" />
        </g>
      )}
    </g>
  )
}
