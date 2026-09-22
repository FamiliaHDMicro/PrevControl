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

  pitch: 1.0,

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


  /*
   * Primeiro tentamos o TTS do próprio PREV.
   *
   * A voz enviada é SEMPRE a mesma.
   */

  try {

    const response = await fetch(
      `/api/tts?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(KATERINA_CONFIG.voice)}`
    );


    if (response.ok) {

      const contentType =
        response.headers.get("content-type") || "";


      /*
       * Se o Worker devolver áudio,
       * reproduzimos diretamente.
       */

      if (contentType.includes("audio")) {

        const blob =
          await response.blob();

        const url =
          URL.createObjectURL(blob);

        const audio =
          new Audio(url);

        katerinaState.currentAudio =
          audio;

        audio.volume =
          KATERINA_CONFIG.volume;


        audio.onended = () => {

          URL.revokeObjectURL(url);

          katerinaState.currentAudio =
            null;

          katerinaSpeaking(false);

        };


        audio.onerror = () => {

          URL.revokeObjectURL(url);

          katerinaState.currentAudio =
            null;

          katerinaSpeaking(false);

        };


        await audio.play();

        return;

      }

    }

  } catch (error) {

    /*
     * Se o TTS ainda não existir,
     * usamos o recurso de voz do navegador.
     */

  }


  /*
   * FALLBACK DO NAVEGADOR
   *
   * Não existe troca de personagem ou voz.
   * O idioma permanece pt-BR.
   */

  if (
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  ) {

    const utterance =
      new SpeechSynthesisUtterance(
        cleanText
      );

    utterance.lang =
      KATERINA_CONFIG.language;

    utterance.rate =
      KATERINA_CONFIG.rate;

    utterance.pitch =
      KATERINA_CONFIG.pitch;

    utterance.volume =
      KATERINA_CONFIG.volume;


    utterance.onend = () => {

      katerinaSpeaking(false);

    };


    utterance.onerror = () => {

      katerinaSpeaking(false);

    };


    window.speechSynthesis.speak(
      utterance
    );

    return;

  }


  katerinaSpeaking(false);

}


/* =========================================================
   PARAR VOZ
   ========================================================= */

function stopKaterinaSpeech() {

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
