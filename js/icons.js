/* KrakenIcons — hình phương tiện & nhân vật vẽ bằng SVG (thay emoji, tránh bị cắt hình theo nền tảng)
   Mọi SVG dùng preserveAspectRatio="xMidYMid meet" để luôn hiện trọn hình trong khung. */
window.KrakenIcons = (function () {
  function svg(viewBox, body, extra) {
    return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ${extra || ""}>${body}</svg>`;
  }

  /* Tàu chiến — nhìn ngang, mũi hướng phải. viewBox 200x120 */
  function warship(accent) {
    const hull = accent || "#5b6b7f";
    return svg("0 0 200 120", `
      <rect x="97" y="14" width="5" height="26" fill="#495057"/>
      <path d="M102 14 L127 20 L102 27 Z" fill="#ef476f"/>
      <rect x="84" y="38" width="34" height="30" rx="3" fill="#a8bdd4" stroke="#6c7a89" stroke-width="2"/>
      <rect x="89" y="44" width="24" height="9" rx="2" fill="#caf0f8"/>
      <rect x="118" y="52" width="20" height="16" rx="3" fill="#93a9c0" stroke="#6c7a89" stroke-width="2"/>
      <rect x="56" y="54" width="26" height="14" rx="3" fill="#93a9c0" stroke="#6c7a89" stroke-width="2"/>
      <rect x="38" y="66" width="128" height="11" fill="#8496ad"/>
      <rect x="140" y="57" width="30" height="10" rx="4" fill="#6c7a89"/>
      <rect x="168" y="59" width="24" height="5" rx="2" fill="#495057"/>
      <rect x="30" y="57" width="26" height="10" rx="4" fill="#6c7a89"/>
      <rect x="10" y="59" width="22" height="5" rx="2" fill="#495057"/>
      <path d="M8 77 L192 77 L173 107 L33 107 Z" fill="${hull}" stroke="#3d4a5c" stroke-width="2.5"/>
      <path d="M20 96 L181 96 L173 107 L33 107 Z" fill="#d90429" opacity="0.85"/>
      <circle cx="55" cy="87" r="4" fill="#ffd60a"/><circle cx="78" cy="87" r="4" fill="#ffd60a"/>
      <circle cx="101" cy="87" r="4" fill="#ffd60a"/><circle cx="124" cy="87" r="4" fill="#ffd60a"/>
      <circle cx="147" cy="87" r="4" fill="#ffd60a"/>`);
  }

  /* Ô tô — nhìn ngang. viewBox 200x120 */
  function car(accent) {
    const body = accent || "#e63946";
    return svg("0 0 200 120", `
      <path d="M14 86 L18 64 Q20 55 33 53 L56 50 Q68 30 96 30 Q126 30 140 50 L168 54 Q185 57 187 71 L187 86 Q187 92 179 92 L22 92 Q13 92 14 86 Z" fill="${body}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <path d="M64 50 Q74 36 94 36 L94 50 Z" fill="#caf0f8"/>
      <path d="M100 36 Q120 37 132 50 L100 50 Z" fill="#caf0f8"/>
      <rect x="95" y="34" width="5" height="18" fill="${body}"/>
      <rect x="104" y="60" width="20" height="5" rx="2.5" fill="rgba(255,255,255,.65)"/>
      <circle cx="180" cy="70" r="5" fill="#ffe66d"/>
      <circle cx="20" cy="70" r="5" fill="#ef476f"/>
      <circle cx="56" cy="92" r="16" fill="#22223b"/><circle cx="56" cy="92" r="7" fill="#ced4da"/>
      <circle cx="148" cy="92" r="16" fill="#22223b"/><circle cx="148" cy="92" r="7" fill="#ced4da"/>`);
  }

  /* Máy bay chiến đấu — nhìn ngang, mũi hướng phải. viewBox 200x120 */
  function jet(accent) {
    const body = accent || "#7f8ea3";
    return svg("0 0 200 120", `
      <path d="M26 56 L40 26 L58 26 L54 54 Z" fill="${body}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <path d="M6 64 Q50 48 118 50 L166 56 Q190 59 193 65 Q190 72 166 75 L112 82 Q52 88 12 76 Q4 71 6 64 Z" fill="${body}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <path d="M112 52 Q128 40 142 50 Q146 55 138 58 L116 58 Q108 56 112 52 Z" fill="#48cae4" stroke="#277da1" stroke-width="2"/>
      <path d="M76 74 L48 104 L84 104 L108 76 Z" fill="#5d6d80" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <path d="M18 74 L30 92 L46 92 L40 72 Z" fill="#5d6d80"/>
      <rect x="60" y="60" width="34" height="6" rx="3" fill="#ef476f"/>
      <circle cx="128" cy="66" r="3.5" fill="#ffd60a"/><circle cx="146" cy="66" r="3.5" fill="#ffd60a"/>
      <path d="M4 66 L-6 62 L-6 74 Z" fill="#ffb703"/>`);
  }

  /* Xe đua NHÌN NGANG — mũi hướng phải, cánh gió sau, dùng cho Đua Xe Toán. viewBox 200x120 */
  function carSide(accent) {
    const body = accent || "#e63946";
    return svg("0 0 200 120", `
      <rect x="8" y="34" width="34" height="8" rx="4" fill="#22223b"/>
      <rect x="34" y="38" width="7" height="20" fill="#22223b"/>
      <path d="M12 88 L20 66 Q24 56 44 53 L74 49 Q88 30 116 30 Q142 30 154 50 L176 56 Q190 60 191 73 L191 88 Q191 94 183 94 L20 94 Q11 94 12 88 Z" fill="${body}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <path d="M82 49 Q92 36 112 36 L112 49 Z" fill="#caf0f8"/>
      <path d="M118 36 Q136 38 146 50 L118 49 Z" fill="#caf0f8"/>
      <circle cx="105" cy="40" r="7" fill="#ffd60a" stroke="#22223b" stroke-width="2"/>
      <rect x="14" y="72" width="176" height="8" fill="#ffffff" opacity="0.8"/>
      <circle cx="186" cy="72" r="5" fill="#ffe66d"/>
      <circle cx="50" cy="94" r="17" fill="#22223b"/><circle cx="50" cy="94" r="8" fill="#ced4da"/>
      <circle cx="152" cy="94" r="17" fill="#22223b"/><circle cx="152" cy="94" r="8" fill="#ced4da"/>`);
  }

  /* Xe đua nhìn từ trên cao — mũi xe hướng PHẢI (+x), dùng cho Màn 4 để xoay theo hướng chạy. viewBox 120x80 */
  function raceCar() {
    return svg("0 0 120 80", `
      <rect x="20" y="2" width="17" height="11" rx="4" fill="#22223b"/>
      <rect x="20" y="67" width="17" height="11" rx="4" fill="#22223b"/>
      <rect x="88" y="2" width="17" height="11" rx="4" fill="#22223b"/>
      <rect x="88" y="67" width="17" height="11" rx="4" fill="#22223b"/>
      <rect x="3" y="13" width="9" height="54" rx="4" fill="#9d0208"/>
      <rect x="107" y="15" width="8" height="50" rx="4" fill="#9d0208"/>
      <path d="M13 22 Q13 14 25 13 L76 13 Q103 14 111 40 Q103 66 76 67 L25 67 Q13 66 13 58 Z" fill="#e63946" stroke="#9d0208" stroke-width="2"/>
      <rect x="16" y="36.5" width="92" height="7" fill="#ffffff" opacity="0.75"/>
      <path d="M30 20 L52 20 L46 34 L30 34 Z" fill="#caf0f8"/>
      <ellipse cx="57" cy="40" rx="16" ry="12" fill="#22223b"/>
      <circle cx="57" cy="40" r="6.5" fill="#ffd60a"/>
      <path d="M84 22 Q98 26 100 40 Q98 54 84 58 L78 40 Z" fill="#ff8fa3" opacity="0.55"/>`);
  }

  /* Thủ môn NGƯỜI — to, dang tay đeo găng. viewBox 160x200 */
  function goalkeeper() {
    return svg("0 0 160 200", `
      <rect x="60" y="128" width="15" height="46" fill="#f2c297"/>
      <rect x="85" y="128" width="15" height="46" fill="#f2c297"/>
      <rect x="60" y="162" width="15" height="12" fill="#ffffff"/>
      <rect x="85" y="162" width="15" height="12" fill="#ffffff"/>
      <ellipse cx="65" cy="182" rx="13" ry="7" fill="#22223b"/>
      <ellipse cx="95" cy="182" rx="13" ry="7" fill="#22223b"/>
      <path d="M50 62 L16 82" stroke="#ffd60a" stroke-width="15" stroke-linecap="round"/>
      <path d="M110 62 L144 82" stroke="#ffd60a" stroke-width="15" stroke-linecap="round"/>
      <path d="M18 80 L8 88" stroke="#f2c297" stroke-width="11" stroke-linecap="round"/>
      <path d="M142 80 L152 88" stroke="#f2c297" stroke-width="11" stroke-linecap="round"/>
      <circle cx="10" cy="94" r="15" fill="#ffffff" stroke="#22223b" stroke-width="3"/>
      <circle cx="150" cy="94" r="15" fill="#ffffff" stroke="#22223b" stroke-width="3"/>
      <circle cx="10" cy="94" r="6" fill="#ef476f"/>
      <circle cx="150" cy="94" r="6" fill="#ef476f"/>
      <path d="M48 50 Q46 108 54 112 L106 112 Q114 108 112 50 Q80 40 48 50 Z" fill="#ffd60a" stroke="#d9a404" stroke-width="2"/>
      <rect x="48" y="66" width="64" height="9" fill="#22223b"/>
      <rect x="48" y="86" width="64" height="9" fill="#22223b"/>
      <rect x="54" y="108" width="52" height="24" rx="4" fill="#22223b"/>
      <circle cx="80" cy="28" r="18" fill="#f2c297"/>
      <path d="M62 27 Q60 8 80 8 Q100 8 98 27 Q92 16 80 16 Q68 16 62 27 Z" fill="#40342a"/>
      <circle cx="73" cy="29" r="2.4" fill="#22223b"/><circle cx="87" cy="29" r="2.4" fill="#22223b"/>
      <path d="M74 38 Q80 42 86 38" fill="none" stroke="#22223b" stroke-width="2.5" stroke-linecap="round"/>`);
  }

  /* Cầu thủ tiền đạo nhìn từ phía sau — áo RONALDO số 7, 1 chân đang sút. viewBox 160x200
     Hình vẽ hoạt hình tự vẽ, không dùng ảnh người thật. */
  function striker() {
    return svg("0 0 160 200", `
      <g transform="rotate(-32 98 136)">
        <rect x="90" y="134" width="15" height="42" fill="#f2c297"/>
        <rect x="90" y="160" width="15" height="13" fill="#d90429"/>
        <ellipse cx="98" cy="182" rx="13" ry="6.5" fill="#111111"/>
      </g>
      <rect x="58" y="134" width="15" height="42" fill="#f2c297"/>
      <rect x="58" y="160" width="15" height="13" fill="#d90429"/>
      <ellipse cx="63" cy="182" rx="13" ry="6.5" fill="#111111"/>
      <path d="M46 58 L22 96" stroke="#d90429" stroke-width="14" stroke-linecap="round"/>
      <path d="M114 58 L136 94" stroke="#d90429" stroke-width="14" stroke-linecap="round"/>
      <path d="M24 94 L18 104" stroke="#f2c297" stroke-width="10" stroke-linecap="round"/>
      <path d="M134 92 L142 100" stroke="#f2c297" stroke-width="10" stroke-linecap="round"/>
      <path d="M47 48 Q44 104 52 112 L108 112 Q116 104 113 48 Q80 38 47 48 Z" fill="#d90429" stroke="#9d0208" stroke-width="2"/>
      <rect x="47" y="48" width="66" height="8" fill="#ffffff" opacity="0.85"/>
      <text x="80" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" letter-spacing="1" fill="#ffffff">RONALDO</text>
      <text x="80" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">7</text>
      <rect x="54" y="110" width="52" height="26" rx="4" fill="#ffffff" stroke="#ced4da" stroke-width="2"/>
      <rect x="72" y="44" width="16" height="10" fill="#f2c297"/>
      <circle cx="80" cy="28" r="17" fill="#241d18"/>
      <path d="M63 26 Q64 12 80 11 Q97 12 97 28 Q90 18 79 19 Q68 20 63 26 Z" fill="#171310"/>
      <circle cx="63" cy="30" r="3.5" fill="#f2c297"/><circle cx="97" cy="30" r="3.5" fill="#f2c297"/>`);
  }

  /* Ronaldo CHẠY — nhìn nghiêng, mặt hướng PHẢI, đang chạy ăn mừng (dùng cho animation SIUUU).
     Áo đỏ số 7 trắng, quần trắng. viewBox 200x160, mặt đất ở y≈148. Hình vẽ tự vẽ, không dùng ảnh thật. */
  function ronaldoRun() {
    return svg("0 0 200 160", `
      <path d="M96 40 L72 60 L82 84" fill="none" stroke="#b00524" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="83" cy="86" r="5.5" fill="#f2c297"/>
      <path d="M100 88 L76 116 L88 140" fill="none" stroke="#f2c297" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M81 124 L88 140" fill="none" stroke="#d90429" stroke-width="13" stroke-linecap="round"/>
      <ellipse cx="93" cy="143" rx="10" ry="5" fill="#111111"/>
      <path d="M92 34 L128 38 L132 82 L98 80 Z" fill="#d90429" stroke="#9d0208" stroke-width="2"/>
      <text x="112" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff">7</text>
      <path d="M94 76 L134 78 L138 104 L112 106 L110 90 L100 104 L88 100 Z" fill="#ffffff" stroke="#ced4da" stroke-width="2"/>
      <path d="M116 100 L148 112 L156 138" fill="none" stroke="#f2c297" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M151 122 L156 138" fill="none" stroke="#d90429" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="161" cy="141" rx="10" ry="5" fill="#111111"/>
      <path d="M124 40 L146 56" fill="none" stroke="#d90429" stroke-width="13" stroke-linecap="round"/>
      <path d="M146 56 L135 80" fill="none" stroke="#f2c297" stroke-width="11" stroke-linecap="round"/>
      <circle cx="134" cy="82" r="5.5" fill="#f2c297"/>
      <rect x="112" y="26" width="11" height="12" fill="#f2c297"/>
      <circle cx="121" cy="17" r="13" fill="#f2c297"/>
      <path d="M108 16 Q107 3 121 3 Q134 3 134 17 Q129 8 120 8 Q111 9 108 16 Z" fill="#171310"/>`);
  }

  /* Ronaldo TRƯỢT CỎ ăn mừng bằng ĐẦU GỐI — nhìn nghiêng, trượt về phía PHẢI:
     ĐẦU GỐI dẫn đầu ở phía trước-dưới (x≈138, chạm cỏ), ống chân duỗi ra SAU nằm trên cỏ,
     mũi giày hướng về phía sau; đùi dốc từ gối lên hông, thân người ngồi trên gối, hơi ngả ra
     sau, 2 tay giơ cao. Áo đỏ số 7. viewBox 200x160, mặt đất ở y≈148. Hình tự vẽ. */
  function ronaldoSlide() {
    return svg("0 0 200 160", `
      <path d="M92 58 L68 32 L60 12" fill="none" stroke="#d90429" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M68 32 L60 12" fill="none" stroke="#f2c297" stroke-width="10" stroke-linecap="round"/>
      <circle cx="59" cy="9" r="5.5" fill="#f2c297"/>
      <path d="M128 143 L84 147" fill="none" stroke="#f2c297" stroke-width="12" stroke-linecap="round"/>
      <path d="M97 146 L84 147" fill="none" stroke="#d90429" stroke-width="11" stroke-linecap="round"/>
      <ellipse cx="77" cy="146" rx="10" ry="4.5" fill="#111111"/>
      <path d="M106 102 L130 138" fill="none" stroke="#f2c297" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M82 48 L110 52 L118 100 L90 104 Z" fill="#d90429" stroke="#9d0208" stroke-width="2"/>
      <text x="100" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" transform="rotate(-10 100 84)">7</text>
      <path d="M88 92 L118 94 L130 116 L96 120 Z" fill="#ffffff" stroke="#ced4da" stroke-width="2"/>
      <path d="M110 104 L138 136" fill="none" stroke="#f2c297" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M140 141 L94 146" fill="none" stroke="#f2c297" stroke-width="12" stroke-linecap="round"/>
      <path d="M107 145 L94 146" fill="none" stroke="#d90429" stroke-width="11" stroke-linecap="round"/>
      <ellipse cx="87" cy="146" rx="10" ry="4.5" fill="#111111"/>
      <path d="M104 54 L122 30 L132 12" fill="none" stroke="#d90429" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M122 30 L132 12" fill="none" stroke="#f2c297" stroke-width="10" stroke-linecap="round"/>
      <circle cx="133" cy="9" r="5.5" fill="#f2c297"/>
      <rect x="93" y="38" width="11" height="12" fill="#f2c297"/>
      <circle cx="97" cy="27" r="13" fill="#f2c297"/>
      <path d="M84 25 Q83 12 97 12 Q110 12 110 26 Q105 17 96 17 Q87 18 84 25 Z" fill="#171310"/>`);
  }

  return { warship, car, carSide, jet, raceCar, goalkeeper, striker, ronaldoRun, ronaldoSlide };
})();
