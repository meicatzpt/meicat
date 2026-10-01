/* ==========================================================
   TOP GIFTERS · MEICAT
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const previousWorldButton =
    document.getElementById("worldPrevious");

  const nextWorldButton =
    document.getElementById("worldNext");

  previousWorldButton.addEventListener(
    "click",
    () => {
      window.location.href = "../?world=braincell";
    }
  );

  nextWorldButton.addEventListener(
    "click",
    () => {
      window.location.href = "../";
    }
  );

  /* ========================================================
     CONTACT
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

    contactButton.focus();

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

        showCopiedState();

      } catch (error) {

        /*
          file:// fallback for local testing.
        */

        const temporaryInput =
          document.createElement("textarea");

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

        showCopiedState();

      }

    }
  );


  function showCopiedState() {

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


  /* ========================================================
     PLACEHOLDER TOP 1–3 LINKS

     Prevent navigation until real ZEPETO profiles are supplied.
     ======================================================== */

  const placeholderLinks =
    document.querySelectorAll(
      "[data-placeholder-link]"
    );


  placeholderLinks.forEach(
    (link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

        }
      );

    }
  );

});
