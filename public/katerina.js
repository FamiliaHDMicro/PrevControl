/* =========================================================
   PREV — KATERINA
   Assistente visual e voz única do sistema

   REGRA:
   Katerina é a única voz.
   Não trocar voz por módulo.
   Não trocar voz por setor.
   Não usar Jarvis.
   ========================================================= */


/* =========================================================
   CONFIGURAÇÃO ÚNICA DA KATERINA
   ========================================================= */

const KATERINA_CONFIG = {

  name: "Katerina",

  /*
   * Uma única voz para todo o PREV.
   * Quando o endpoint /api/tts existir, esta identificação
   * será enviada sempre da mesma forma.
   */
  voice: "pt-BR-FranciscaNeural",

  language: "pt-BR",

  rate: 0.96,

  pitch: 1.02,

  /* TTS do servidor: ligar quando existir /api/tts */
  serverTTS: false,

  volume: 1.0
};


/* =========================================================
   ESTADO
   ========================================================= */

const katerinaState = {

  speaking: false,

  thinking: false,

  ready: false,

  speechQueue: [],

  currentAudio: null

};


/* =========================================================
   ELEMENTO PRINCIPAL
   ========================================================= */

function getKaterinaElement() {

  return document.getElementById("katerina");

}


/* =========================================================
   MOVIMENTO — ENTRADA
   ========================================================= */

function katerinaArrival() {

  const element = getKaterinaElement();

  if (!element) return;

  element.classList.remove(
    "katerina-arrival",
    "katerina-thinking",
    "katerina-speaking",
    "katerina-follow"
  );

  void element.offsetWidth;

  element.classList.add("katerina-arrival");

}


/* =========================================================
   MOVIMENTO — CLIQUE
   ========================================================= */

function katerinaSpin() {

  const element = getKaterinaElement();

  if (!element) return;

  element.classList.remove("katerina-spin");

  void element.offsetWidth;

  element.classList.add("katerina-spin");

}


/* =========================================================
   MOVIMENTO — PENSANDO
   ========================================================= */

function katerinaThinking(active = true) {

  const element = getKaterinaElement();

  if (!element) return;

  katerinaState.thinking = active;

  element.classList.toggle(
    "katerina-thinking",
    active
  );

}


/* =========================================================
   MOVIMENTO — FALAR
   ========================================================= */

function katerinaSpeaking(active = true) {

  const element = getKaterinaElement();

  if (!element) return;

  katerinaState.speaking = active;

  element.classList.toggle(
    "katerina-speaking",
    active
  );

}


/* =========================================================
   MOVIMENTO — "SIGA-ME"
   ========================================================= */

function katerinaFollow() {

  const element = getKaterinaElement();

  if (!element) return;

  element.classList.remove("katerina-follow");

  void element.offsetWidth;

  element.classList.add("katerina-follow");

}


/* =========================================================
   MOVIMENTO — PEQUENA COMEMORAÇÃO
   ========================================================= */

function katerinaCelebrate() {

  const element = getKaterinaElement();

  if (!element) return;

  element.classList.remove("katerina-celebrate");

  void element.offsetWidth;

  element.classList.add("katerina-celebrate");

}


/* =========================================================
   MOVIMENTO — ERRO / AVISO
   ========================================================= */

function katerinaAttention() {

  const element = getKaterinaElement();

  if (!element) return;

  element.classList.remove("katerina-attention");

  void element.offsetWidth;

  element.classList.add("katerina-attention");

}


/* =========================================================
   TEXTO DA KATERINA
   ========================================================= */

function katerinaSayText(text) {

  const message = document.querySelector(".message-text");

  if (!message) return;

  message.textContent = text;

}


/* =========================================================
   HUMANIZADOR DA KATERINA
   Adaptado do Audio-Humanizador (dicionário de pronúncia,
   pausas humanas e escolha de voz). Só muda COMO ela fala:
   o texto na tela continua exatamente igual.
   ========================================================= */

/*
 * Pronúncia (alias fonético). A chave é o que está escrito,
 * o valor é como a Katerina deve dizer.
 */
const KATERINA_PRONUNCIA = {
  /* Previdência e trabalho */
  "inss": "í-ene-ésse-ésse",
  "fgts": "éfe-gê-tê-ésse",
  "bpc": "bê-pê-cê",
  "loas": "lôas",
  "cnis": "cê-ene-í-ésse",
  "cct": "cê-cê-tê",
  "clt": "cê-éle-tê",
  "cpf": "cê-pê-éfe",
  "cnpj": "cê-ene-pê-jota",
  "rg": "érre-gê",
  "mei": "mêi",
  "gov.br": "gov ponto bê-érre",
  "art.": "artigo",

  /* Termos técnicos (do banco de palavras) */
  "pix": "píks",
  "wifi": "uífai",
  "whatsapp": "uótsap",
  "usb": "i-usbê",
  "pdf": "pê-dê-éfe",
  "gps": "gê-pê-ésse",
  "nfc": "êne-êfê-cê",
  "e-mail": "i-mêil",
  "email": "i-mêil"
};

/* Ordem: termos mais longos primeiro ("gov.br" antes de "br"). */
const KATERINA_TERMOS_ORDENADOS =
  Object.keys(KATERINA_PRONUNCIA)
    .sort((a, b) => b.length - a.length);

function katerinaEscaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function katerinaHumanizar(texto) {
  let fala = String(texto);

  /* Valores: "R$ 1.518,00" vira "1.518,00 reais" (na ordem certa). */
  fala = fala.replace(
    /R\$\s*([\d][\d.,]*)/gi,
    "$1 reais"
  );

  /* Porcentagem: "30%" vira "30 por cento". */
  fala = fala.replace(/%/g, " por cento");

  /* Dicionário de pronúncia. */
  for (const termo of KATERINA_TERMOS_ORDENADOS) {
    const alias = KATERINA_PRONUNCIA[termo];
    const padrao = new RegExp(
      "(?<![\\p{L}\\d])" +
        katerinaEscaparRegex(termo) +
        "(?![\\p{L}\\d])",
      "giu"
    );
    fala = fala.replace(padrao, alias);
  }

  /* Letras repetidas ("aaaaa") viram uma só, como no original. */
  fala = fala.replace(/([a-zà-ú])\1{2,}/gi, "$1");

  return fala.replace(/\s+/g, " ").trim();
}

/*
 * Pausas humanas. O navegador não entende SSML, então
 * quebramos o texto em pedaços e esperamos entre eles.
 */
const KATERINA_PAUSAS = {
  "...": 600,
  "…": 600,
  ",": 200,
  ";": 250,
  ":": 250,
  ".": 350,
  "!": 400,
  "?": 500
};

function katerinaDividirEmPartes(texto) {
  const partes = [];
  /* Ponto e vírgula dentro de números (1.518,00) não cortam a fala. */
  const regra =
    /((?:[^.,;:!?…]|(?<=\d)[.,](?=\d))+)(\.{3}|…|[.,;:!?])?/g;
  let achado;

  while ((achado = regra.exec(texto)) !== null) {
    const pedaco = (achado[1] || "").trim();
    const sinal = achado[2] || "";

    if (!pedaco) continue;

    partes.push({
      texto: pedaco + sinal,
      pausa: KATERINA_PAUSAS[sinal] || 0
    });
  }

  return partes.length
    ? partes
    : [{ texto: texto, pausa: 0 }];
}

/*
 * Voz: prefere as vozes naturais pt-BR (no Edge são as mesmas
 * Francisca e Thalita do humanizador). Se não houver, usa
 * qualquer voz pt-BR do aparelho.
 */
function katerinaEscolherVoz() {
  if (!("speechSynthesis" in window)) return null;

  const vozes = window.speechSynthesis.getVoices() || [];
  const ptbr = vozes.filter((v) =>
    /^pt[-_]BR/i.test(v.lang)
  );

  if (!ptbr.length) return null;

  const preferencias = [
    /francisca/i,
    /thalita/i,
    /natural|online/i,
    /google/i,
    /maria|luciana|vit[oó]ria/i
  ];

  for (const preferencia of preferencias) {
    const achada = ptbr.find((v) => preferencia.test(v.name));
    if (achada) return achada;
  }

  return ptbr[0];
}

function katerinaFalarPartes(partes, token) {
  let indice = 0;

  const proxima = () => {
    if (token !== katerinaState.speechToken) return;

    if (indice >= partes.length) {
      katerinaSpeaking(false);
      return;
    }

    const parte = partes[indice++];
    const fala = new SpeechSynthesisUtterance(parte.texto);

    fala.lang = KATERINA_CONFIG.language;
    fala.rate = KATERINA_CONFIG.rate;
    fala.pitch = KATERINA_CONFIG.pitch;
    fala.volume = KATERINA_CONFIG.volume;

    const voz = katerinaEscolherVoz();
    if (voz) {
      try {
        fala.voice = voz;
      } catch (error) {
        /* usa a voz padrão do aparelho */
      }
    }

    fala.onend = () => {
      setTimeout(proxima, parte.pausa);
    };

    fala.onerror = () => {
      if (token === katerinaState.speechToken) {
        katerinaSpeaking(false);
      }
    };

    window.speechSynthesis.speak(fala);
  };

  proxima();
}


/* =========================================================
   VOZ — ÚNICA
   ========================================================= */

async function katerinaSpeak(text) {

  if (!text) return;

  const cleanText =
    String(text)
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanText) return;

  /*
   * Evita duas falas simultâneas.
   */
  stopKaterinaSpeech();

  katerinaSpeaking(true);

  const token = katerinaState.speechToken;

  /*
   * Texto como ela FALA (siglas, valores, pausas).
   * O texto da tela não muda.
   */
  const textoFalado = katerinaHumanizar(cleanText);

  /*
   * TTS do servidor (desligado até existir /api/tts no Worker).
   */
  if (KATERINA_CONFIG.serverTTS) {
    try {
      const response = await fetch(
        `/api/tts?text=${encodeURIComponent(textoFalado)}&voice=${encodeURIComponent(KATERINA_CONFIG.voice)}`
      );

      if (token !== katerinaState.speechToken) return;

      if (response.ok) {
        const contentType =
          response.headers.get("content-type") || "";

        if (contentType.includes("audio")) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          katerinaState.currentAudio = audio;
          audio.volume = KATERINA_CONFIG.volume;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            katerinaState.currentAudio = null;
            katerinaSpeaking(false);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            katerinaState.currentAudio = null;
            katerinaSpeaking(false);
          };

          await audio.play();
          return;
        }
      }
    } catch (error) {
      /* segue para a voz do navegador */
    }
  }

  /*
   * VOZ DO NAVEGADOR, com pausas e pronúncia humanizadas.
   * O idioma permanece pt-BR.
   */
  if (
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  ) {
    katerinaFalarPartes(
      katerinaDividirEmPartes(textoFalado),
      token
    );
    return;
  }

  katerinaSpeaking(false);
}


/* =========================================================
   PARAR VOZ
   ========================================================= */

function stopKaterinaSpeech() {

  katerinaState.speechToken =
    (katerinaState.speechToken || 0) + 1;

  if (
    katerinaState.currentAudio
  ) {

    try {

      katerinaState.currentAudio.pause();

    } catch (error) {}

    katerinaState.currentAudio =
      null;

  }


  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis.cancel();

  }


  katerinaState.speaking =
    false;

  katerinaSpeaking(false);

}


/* =========================================================
   FALAR + MOSTRAR TEXTO
   ========================================================= */

async function katerinaTalk(text) {

  katerinaSayText(text);

  await katerinaSpeak(text);

}


/* =========================================================
   SAUDAÇÃO
   ========================================================= */

function katerinaWelcome() {

  katerinaSayText(
    "Eu sou a Katerina. Vamos entender sua situação juntos."
  );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function initKaterina() {

  const element =
    getKaterinaElement();

  if (!element) return;


  katerinaState.ready =
    true;


  /*
   * Entrada suave.
   */

  setTimeout(() => {

    katerinaArrival();

  }, 150);


  /*
   * Ao passar o mouse:
   * pequeno movimento.
   *
   * Não fica pulando continuamente.
   */

  element.addEventListener(
    "mouseenter",
    () => {

      if (
        !katerinaState.thinking &&
        !katerinaState.speaking
      ) {

        element.classList.add(
          "katerina-hover"
        );

      }

    }
  );


  element.addEventListener(
    "mouseleave",
    () => {

      element.classList.remove(
        "katerina-hover"
      );

    }
  );


  /*
   * Clique na Katerina.
   */

  element.addEventListener(
    "click",
    () => {

      katerinaSpin();

      setTimeout(() => {

        katerinaTalk(
          "Vamos. Eu acompanho você passo a passo."
        );

      }, 300);

    }
  );

}


/* =========================================================
   EVENTOS GLOBAIS
   ========================================================= */

window.Katerina = {

  speak: katerinaSpeak,

  talk: katerinaTalk,

  say: katerinaSayText,

  thinking: katerinaThinking,

  speaking: katerinaSpeaking,

  follow: katerinaFollow,

  celebrate: katerinaCelebrate,

  attention: katerinaAttention,

  spin: katerinaSpin,

  arrival: katerinaArrival,

  stop: stopKaterinaSpeech

};


/* =========================================================
   CSS DE MOVIMENTO INJETADO PELA KATERINA
   ========================================================= */

function installKaterinaMotion() {

  const style =
    document.createElement("style");

  style.textContent = `

    /* -----------------------------------------
       ENTRADA
       ----------------------------------------- */

    .katerina-arrival {

      animation:
        katerinaArrivalMotion
        .75s
        cubic-bezier(.2,.8,.2,1)
        both;

    }

    @keyframes katerinaArrivalMotion {

      0% {

        opacity: 0;

        transform:
          translateY(28px)
          scale(.92);

      }

      70% {

        opacity: 1;

        transform:
          translateY(-5px)
          scale(1.02);

      }

      100% {

        opacity: 1;

        transform:
          translateY(0)
          scale(1);

      }

    }


    /* -----------------------------------------
       PASSAR O MOUSE
       ----------------------------------------- */

    .katerina-hover {

      animation:
        katerinaHoverMotion
        .55s
        ease-in-out
        both;

    }

    @keyframes katerinaHoverMotion {

      0% {

        transform:
          translateY(0)
          rotate(0deg);

      }

      45% {

        transform:
          translateY(-7px)
          rotate(-2deg);

      }

      100% {

        transform:
          translateY(0)
          rotate(0deg);

      }

    }


    /* -----------------------------------------
       GIRO
       ----------------------------------------- */

    .katerina-spin {

      animation:
        katerinaSpinMotion
        .65s
        cubic-bezier(.3,.8,.3,1);

    }

    @keyframes katerinaSpinMotion {

      0% {

        transform:
          rotate(0deg);

      }

      35% {

        transform:
          rotate(-7deg)
          scale(1.03);

      }

      70% {

        transform:
          rotate(7deg)
          scale(1.03);

      }

      100% {

        transform:
          rotate(0deg)
          scale(1);

      }

    }


    /* -----------------------------------------
       PENSANDO
       ----------------------------------------- */

    .katerina-thinking {

      animation:
        katerinaThinkingMotion
        1.4s
        ease-in-out
        infinite;

    }

    @keyframes katerinaThinkingMotion {

      0%,
      100% {

        transform:
          translateY(0);

      }

      50% {

        transform:
          translateY(-5px);

      }

    }


    /* -----------------------------------------
       FALANDO
       ----------------------------------------- */

    .katerina-speaking
    .katerina-core {

      animation:
        katerinaVoicePulse
        .75s
        ease-in-out
        infinite;

    }

    @keyframes katerinaVoicePulse {

      0%,
      100% {

        transform:
          scale(.92);

      }

      50% {

        transform:
          scale(1.16);

      }

    }


    /* -----------------------------------------
       SIGA-ME
       ----------------------------------------- */

    .katerina-follow {

      animation:
        katerinaFollowMotion
        .9s
        ease-in-out;

    }

    @keyframes katerinaFollowMotion {

      0% {

        transform:
          translateX(0);

      }

      30% {

        transform:
          translateX(10px);

      }

      55% {

        transform:
          translateX(-4px);

      }

      80% {

        transform:
          translateX(7px);

      }

      100% {

        transform:
          translateX(0);

      }

    }


    /* -----------------------------------------
       COMEMORAÇÃO
       ----------------------------------------- */

    .katerina-celebrate {

      animation:
        katerinaCelebrateMotion
        .8s
        ease-out;

    }

    @keyframes katerinaCelebrateMotion {

      0% {

        transform:
          scale(1);

      }

      30% {

        transform:
          scale(1.08)
          rotate(-3deg);

      }

      60% {

        transform:
          scale(1.04)
          rotate(3deg);

      }

      100% {

        transform:
          scale(1)
          rotate(0);

      }

    }


    /* -----------------------------------------
       ATENÇÃO
       ----------------------------------------- */

    .katerina-attention {

      animation:
        katerinaAttentionMotion
        .55s
        ease-in-out;

    }

    @keyframes katerinaAttentionMotion {

      0%,
      100% {

        transform:
          translateX(0);

      }

      25% {

        transform:
          translateX(-5px);

      }

      50% {

        transform:
          translateX(5px);

      }

      75% {

        transform:
          translateX(-3px);

      }

    }

  `;

  document.head.appendChild(style);

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      installKaterinaMotion();

      initKaterina();

    }
  );

} else {

  installKaterinaMotion();

  initKaterina();

}
