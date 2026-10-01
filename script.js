/* ==========================================================
   MEICAT PERSONAL WEBSITE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================================
     WORLD REFERENCES
     ======================================================== */

  const meicatWorld =
    document.getElementById("meicatWorld");

  const braincellWorld =
    document.getElementById("braincellWorld");

  const previousButton =
    document.getElementById("worldPrevious");

  const nextButton =
    document.getElementById("worldNext");

  const homeButton =
    document.getElementById("homeButton");

  const mainMeiAvatar =
    document.querySelector(".world--meicat .meicat-avatar--1");

  mainMeiAvatar.addEventListener(
    "click",
    () => {
      window.location.href = "arcade/";
    }
  );

  const braincellDownloadLinks =
    document.querySelectorAll(
      ".braincell-download-link"
    );

  const braincellDownloadModal =
    document.getElementById(
      "braincellDownloadModal"
    );

  const braincellDownloadClose =
    document.getElementById(
      "braincellDownloadClose"
    );

  const braincellDownloadConfirm =
    document.getElementById(
      "braincellDownloadConfirm"
    );

  const braincellDownloadBackdrop =
    braincellDownloadModal.querySelector(
      ".braincell-download-modal__backdrop"
    );

  let lastBraincellDownloadLink = null;
  let bodyOverflowBeforeDownloadModal = "";


  const worlds = [
    meicatWorld,
    braincellWorld
  ];


  let activeWorldIndex =
    new URLSearchParams(window.location.search).get("world") === "braincell"
      ? 1
      : 0;
  let worldIsAnimating = false;


  /* ========================================================
     HELPERS
     ======================================================== */

  function cleanWorldClasses(world) {

    world.classList.remove(
      "is-active",
      "world-enter-left",
      "world-enter-right",
      "world-enter-active",
      "world-exit-left",
      "world-exit-right"
    );

  }


  function updateTheme(index) {

    const braincellIsActive =
      worlds[index] === braincellWorld;

    document.body.classList.toggle(
      "braincell-active",
      braincellIsActive
    );

  }


  /* ========================================================
     DIRECTIONAL WORLD TRANSITION

     direction = "next"
       current exits left
       incoming enters from right

     direction = "previous"
       current exits right
       incoming enters from left
     ======================================================== */

  function changeWorld(targetIndex, direction) {

    if (worldIsAnimating) {
      return;
    }


    const normalizedIndex =
      (targetIndex + worlds.length) %
      worlds.length;


    if (normalizedIndex === activeWorldIndex) {
      return;
    }


    worldIsAnimating = true;


    const currentWorld =
      worlds[activeWorldIndex];

    const incomingWorld =
      worlds[normalizedIndex];


    cleanWorldClasses(incomingWorld);


    incomingWorld.setAttribute(
      "aria-hidden",
      "false"
    );


    /*
      Place the incoming world slightly offscreen
      BEFORE animation begins.
    */

    if (direction === "previous") {

      incomingWorld.classList.add(
        "world-enter-left"
      );

    } else {

      incomingWorld.classList.add(
        "world-enter-right"
      );

    }


    /*
      Force the browser to acknowledge the
      starting transform before transitioning.
    */

    void incomingWorld.offsetWidth;


    /*
      Begin both animations together.
    */

    currentWorld.classList.remove(
      "is-active"
    );


    if (direction === "previous") {

      currentWorld.classList.add(
        "world-exit-right"
      );

    } else {

      currentWorld.classList.add(
        "world-exit-left"
      );

    }


    incomingWorld.classList.add(
      "world-enter-active"
    );


    /*
      Change the persistent header / arrow theme
      while the worlds are crossing.
    */

    updateTheme(normalizedIndex);


    /*
      Finish transition.
    */

    window.setTimeout(
      () => {

        cleanWorldClasses(currentWorld);

        currentWorld.setAttribute(
          "aria-hidden",
          "true"
        );


        cleanWorldClasses(incomingWorld);

        incomingWorld.classList.add(
          "is-active"
        );

        incomingWorld.setAttribute(
          "aria-hidden",
          "false"
        );


        activeWorldIndex =
          normalizedIndex;


        worldIsAnimating =
          false;

      },
      540
    );

  }


  /* ========================================================
     RIGHT ARROW
     ======================================================== */

  nextButton.addEventListener(
    "click",
    () => {

      if (activeWorldIndex === 1) {
        window.location.href = "top-gifters/";
        return;
      }

      changeWorld(
        activeWorldIndex + 1,
        "next"
      );

    }
  );


  /* ========================================================
     LEFT ARROW
     ======================================================== */

  previousButton.addEventListener(
    "click",
    () => {

      if (activeWorldIndex === 0) {
        window.location.href = "top-gifters/";
        return;
      }

      changeWorld(
        activeWorldIndex - 1,
        "previous"
      );

    }
  );


  /* ========================================================
     HOME

     HOME always returns to Meicat.
    If already there, scroll to the top.

     Treat HOME as a previous/backward transition
     from Braincell.
     ======================================================== */

  homeButton.addEventListener(
    "click",
    () => {

      const scrollBehavior =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth";

      const scrollToTop =
        () => {
          window.scrollTo({
            top: 0,
            behavior: scrollBehavior
          });
        };

      if (activeWorldIndex === 0) {
        scrollToTop();
        return;
      }


      changeWorld(
        0,
        "previous"
      );

      scrollToTop();

    }
  );


  /* ========================================================
     BRAINCELL DESKTOP DOWNLOAD NOTICE
     ======================================================== */

  function isMobileOrTablet() {

    const userAgentDataMobile =
      navigator.userAgentData?.mobile === true;

    const userAgentMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i
        .test(navigator.userAgent);

    if (userAgentDataMobile || userAgentMobile) {
      return true;
    }

    return (
      navigator.maxTouchPoints > 0 &&
      window.matchMedia("(pointer: coarse)").matches
    );

  }


  function openBraincellDownloadModal(downloadLink) {

    lastBraincellDownloadLink = downloadLink;

    bodyOverflowBeforeDownloadModal =
      document.body.style.overflow;

    braincellDownloadModal.classList.add(
      "is-open"
    );

    braincellDownloadModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow = "hidden";

    braincellDownloadConfirm.focus();

  }


  function closeBraincellDownloadModal() {

    braincellDownloadModal.classList.remove(
      "is-open"
    );

    braincellDownloadModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      bodyOverflowBeforeDownloadModal;

    if (lastBraincellDownloadLink) {
      lastBraincellDownloadLink.focus();
    }

    lastBraincellDownloadLink = null;

  }


  braincellDownloadLinks.forEach(
    (downloadLink) => {

      downloadLink.addEventListener(
        "click",
        (event) => {

          if (!isMobileOrTablet()) {
            return;
          }

          event.preventDefault();
          openBraincellDownloadModal(downloadLink);

        }
      );

    }
  );


  braincellDownloadClose.addEventListener(
    "click",
    closeBraincellDownloadModal
  );


  braincellDownloadConfirm.addEventListener(
    "click",
    closeBraincellDownloadModal
  );


  braincellDownloadBackdrop.addEventListener(
    "click",
    closeBraincellDownloadModal
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        braincellDownloadModal.classList.contains(
          "is-open"
        )
      ) {

        closeBraincellDownloadModal();

      }

    }
  );


  /* ========================================================
     CONTACT MODAL
     ======================================================== */

  const contactButton =
    document.getElementById("contactButton");

  const contactModal =
    document.getElementById("contactModal");

  const contactClose =
    document.getElementById("contactClose");

  const contactBackdrop =
    contactModal.querySelector(
      ".contact-modal__backdrop"
    );

  const copyEmailButton =
    document.getElementById("copyEmailButton");

  const businessEmail =
    "meimeizepeto@gmail.com";


  function openContact() {

    contactModal.classList.add(
      "is-open"
    );

    contactModal.setAttribute(
      "aria-hidden",
      "false"
    );

    contactClose.focus();

  }


  function closeContact() {

    contactModal.classList.remove(
      "is-open"
    );

    contactModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  contactButton.addEventListener(
    "click",
    openContact
  );


  contactClose.addEventListener(
    "click",
    closeContact
  );


  contactBackdrop.addEventListener(
    "click",
    closeContact
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        contactModal.classList.contains("is-open")
      ) {

        closeContact();

      }

    }
  );


  /* ========================================================
     COPY EMAIL
     ======================================================== */

  copyEmailButton.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          businessEmail
        );


        copyEmailButton.textContent =
          "COPIED ♡";


        window.setTimeout(
          () => {

            copyEmailButton.textContent =
              "COPY EMAIL";

          },
          1600
        );

      } catch (error) {

        /*
          file:// fallback
        */

        const temporaryInput =
          document.createElement(
            "textarea"
          );


        temporaryInput.value =
          businessEmail;


        temporaryInput.setAttribute(
          "readonly",
          ""
        );


        temporaryInput.style.position =
          "fixed";

        temporaryInput.style.opacity =
          "0";


        document.body.appendChild(
          temporaryInput
        );


        temporaryInput.select();


        document.execCommand(
          "copy"
        );


        temporaryInput.remove();


        copyEmailButton.textContent =
          "COPIED ♡";


        window.setTimeout(
          () => {

            copyEmailButton.textContent =
              "COPY EMAIL";

          },
          1600
        );

      }

    }
  );


  /* ========================================================
     BRAINCELL SETUP SLIDESHOW
     ======================================================== */

  const setupSlideshow =
    document.getElementById(
      "braincellSetupSlideshow"
    );


  if (setupSlideshow) {

    const setupSlides =
      Array.from(
        setupSlideshow.querySelectorAll(
          ".setup-slide"
        )
      );


    const setupDots =
      Array.from(
        setupSlideshow.querySelectorAll(
          ".setup-dot"
        )
      );


    let activeSetupSlide = 0;
    let setupTimer = null;
    let setupIsHovered = false;


    const SETUP_INTERVAL = 6000;


    /* ======================================================
       SHOW SETUP SLIDE
       ====================================================== */

    function showSetupSlide(index) {

      if (setupSlides.length === 0) {
        return;
      }


      const normalizedIndex =
        (index + setupSlides.length) %
        setupSlides.length;


      setupSlides.forEach(
        (slide, slideIndex) => {

          slide.classList.toggle(
            "is-active",
            slideIndex === normalizedIndex
          );

        }
      );


      setupDots.forEach(
        (dot, dotIndex) => {

          const isActive =
            dotIndex === normalizedIndex;


          dot.classList.toggle(
            "is-active",
            isActive
          );


          dot.setAttribute(
            "aria-current",
            isActive
              ? "true"
              : "false"
          );

        }
      );


      activeSetupSlide =
        normalizedIndex;

    }


    /* ======================================================
       TIMER
       ====================================================== */

    function stopSetupSlideshow() {

      if (setupTimer !== null) {

        window.clearInterval(
          setupTimer
        );

        setupTimer = null;

      }

    }


    function startSetupSlideshow() {

      stopSetupSlideshow();


      if (
        setupSlides.length <= 1 ||
        setupIsHovered
      ) {
        return;
      }


      setupTimer =
        window.setInterval(
          () => {

            /*
              Only advance while Braincell is
              the active world.
            */

            if (
              activeWorldIndex !== 1 ||
              worldIsAnimating
            ) {
              return;
            }


            showSetupSlide(
              activeSetupSlide + 1
            );

          },
          SETUP_INTERVAL
        );

    }


    /* ======================================================
       DOT CONTROLS
       ====================================================== */

    setupDots.forEach(
      (dot, index) => {

        dot.addEventListener(
          "click",
          () => {

            showSetupSlide(index);

            startSetupSlideshow();

          }
        );

      }
    );


    /* ======================================================
       PAUSE ON HOVER
       ====================================================== */

    setupSlideshow.addEventListener(
      "mouseenter",
      () => {

        setupIsHovered = true;

        stopSetupSlideshow();

      }
    );


    setupSlideshow.addEventListener(
      "mouseleave",
      () => {

        setupIsHovered = false;

        startSetupSlideshow();

      }
    );


    /* ======================================================
       PAUSE WHEN TAB IS HIDDEN
       ====================================================== */

    document.addEventListener(
      "visibilitychange",
      () => {

        if (document.hidden) {

          stopSetupSlideshow();

        } else {

          startSetupSlideshow();

        }

      }
    );


    /* ======================================================
       INITIAL SETUP STATE
       ====================================================== */

    showSetupSlide(0);

    startSetupSlideshow();

  }

    /* ========================================================
     MEICAT #MEIART SLIDESHOW
     ======================================================== */

  const meiartGallery =
    document.getElementById("meiartGallery");


  if (meiartGallery) {

    const meiartSlots =
      Array.from(
        meiartGallery.querySelectorAll(
          "[data-meiart-slot]"
        )
      );


    const meiartItems = [
      {
        src: "assets/meicat/meiart-01.webp",
        artist: "@fiskca086"
      },
      {
        src: "assets/meicat/meiart-02.webp",
        artist: "@fiskca086"
      },
      {
        src: "assets/meicat/meiart-03.webp",
        artist: "@ilyd22"
      },
      {
        src: "assets/meicat/meiart-04.webp",
        artist: "@yyurii.w"
      }
    ];


    /*
      Slot 1 begins with art 01.
      Slot 2 begins with art 02.
    */

    const meiartState = [
      {
        index: 0,
        paused: false
      },
      {
        index: 1,
        paused: false
      }
    ];


    /*
      FAST ROTATION

      Each Polaroid changes every 3 seconds.
      The second Polaroid is offset by 1.5 seconds.

      Result:
      something changes roughly every 1.5 seconds.
    */

    const MEIART_INTERVAL = 6000;
    const MEIART_OFFSET = 3000;
    const MEIART_FADE = 400;


    let meiartTimerOne = null;
    let meiartTimerTwo = null;
    let meiartOffsetTimer = null;


    /* ======================================================
       FIND NEXT ARTWORK
       ====================================================== */

    function getNextMeiartIndex(slotIndex) {

      const otherSlotIndex =
        slotIndex === 0 ? 1 : 0;


      let nextIndex =
        (
          meiartState[slotIndex].index + 1
        ) % meiartItems.length;


      /*
        Avoid showing the exact same artwork
        in both Polaroids at once.
      */

      if (
        nextIndex ===
        meiartState[otherSlotIndex].index
      ) {

        nextIndex =
          (
            nextIndex + 1
          ) % meiartItems.length;

      }


      return nextIndex;

    }


    /* ======================================================
       CHANGE ARTWORK
       ====================================================== */

    function changeMeiart(slotIndex) {

      if (
        document.hidden ||
        activeWorldIndex !== 0 ||
        worldIsAnimating ||
        meiartState[slotIndex].paused
      ) {
        return;
      }


      const slot =
        meiartSlots[slotIndex];


      if (!slot) {
        return;
      }


      const image =
        slot.querySelector(".meiart-image");

      const credit =
        slot.querySelector(".meiart-credit");


      if (!image || !credit) {
        return;
      }


      const nextIndex =
        getNextMeiartIndex(slotIndex);

      const nextItem =
        meiartItems[nextIndex];


      /*
        Fade current artwork out.
      */

      image.classList.add("is-changing");
      credit.classList.add("is-changing");


      window.setTimeout(
        () => {

          image.src =
            nextItem.src;

          image.alt =
            `Fan art for Meicat by ${nextItem.artist}`;

          credit.textContent =
            nextItem.artist;


          meiartState[slotIndex].index =
            nextIndex;


          /*
            Fade the new artwork back in.
          */

          requestAnimationFrame(
            () => {

              requestAnimationFrame(
                () => {

                  image.classList.remove(
                    "is-changing"
                  );

                  credit.classList.remove(
                    "is-changing"
                  );

                }
              );

            }
          );

        },
        MEIART_FADE
      );

    }


    /* ======================================================
       START
       ====================================================== */

    function startMeiartSlideshow() {

      stopMeiartSlideshow();


      meiartTimerOne =
        window.setInterval(
          () => {

            changeMeiart(0);

          },
          MEIART_INTERVAL
        );


      /*
        Start the second Polaroid halfway
        between changes to create the stagger.
      */

      meiartOffsetTimer =
        window.setTimeout(
          () => {

            changeMeiart(1);


            meiartTimerTwo =
              window.setInterval(
                () => {

                  changeMeiart(1);

                },
                MEIART_INTERVAL
              );

          },
          MEIART_OFFSET
        );

    }


    /* ======================================================
       STOP
       ====================================================== */

    function stopMeiartSlideshow() {

      if (meiartTimerOne !== null) {

        window.clearInterval(
          meiartTimerOne
        );

        meiartTimerOne = null;

      }


      if (meiartTimerTwo !== null) {

        window.clearInterval(
          meiartTimerTwo
        );

        meiartTimerTwo = null;

      }


      if (meiartOffsetTimer !== null) {

        window.clearTimeout(
          meiartOffsetTimer
        );

        meiartOffsetTimer = null;

      }

    }


    /* ======================================================
       PAUSE INDIVIDUAL ART ON HOVER / FOCUS
       ====================================================== */

    meiartSlots.forEach(
      (slot, slotIndex) => {

        slot.addEventListener(
          "mouseenter",
          () => {

            meiartState[slotIndex].paused =
              true;

          }
        );


        slot.addEventListener(
          "mouseleave",
          () => {

            meiartState[slotIndex].paused =
              false;

          }
        );


        slot.addEventListener(
          "focusin",
          () => {

            meiartState[slotIndex].paused =
              true;

          }
        );


        slot.addEventListener(
          "focusout",
          () => {

            meiartState[slotIndex].paused =
              false;

          }
        );

      }
    );


    /* ======================================================
       TAB VISIBILITY
       ====================================================== */

    document.addEventListener(
      "visibilitychange",
      () => {

        if (document.hidden) {

          stopMeiartSlideshow();

        } else {

          startMeiartSlideshow();

        }

      }
    );


    /* ======================================================
       INITIALIZE
       ====================================================== */

    startMeiartSlideshow();

  }

  /* ========================================================
     INITIAL WORLD STATE
     ======================================================== */

  const worldStage =
    document.querySelector(".world-stage");

  worldStage.style.transition = "none";

  worlds.forEach(
    (world, index) => {

      cleanWorldClasses(world);

      const isInitialWorld =
        index === activeWorldIndex;


      world.classList.toggle(
        "is-active",
        isInitialWorld
      );


      world.setAttribute(
        "aria-hidden",
        isInitialWorld
          ? "false"
          : "true"
      );

    }
  );


  updateTheme(activeWorldIndex);

  void worldStage.offsetWidth;

  worldStage.style.removeProperty("transition");

});