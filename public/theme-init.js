(function () {
  try {
    var t = localStorage.getItem("theme");
    document.documentElement.classList.add(
      t === "light"
        ? "light-theme"
        : t === "dark"
        ? "dark-theme"
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark-theme"
        : "light-theme"
    );
  } catch (e) {}
})();
