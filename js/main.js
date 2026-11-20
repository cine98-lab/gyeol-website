// 결 GYEOL — site behaviour. No backend yet: forms validate and show a status message only.
(function () {
  'use strict';

  var isKo = (document.documentElement.lang || 'ko').indexOf('ko') === 0;
  var t = isKo ? {
    booked: '예약 요청을 받았습니다. 확인 후 연락드리겠습니다.',
    missing: '비어 있는 칸을 채워 주세요: ',
    consent: '개인정보 수집·이용에 동의해 주세요.',
    subscribed: '구독 신청을 받았습니다.',
    badEmail: '이메일 주소를 확인해 주세요.'
  } : {
    booked: 'We’ve received your request and will be in touch to confirm.',
    missing: 'Please fill in: ',
    consent: 'Please agree to the consent statement.',
    subscribed: 'Thanks, you’re subscribed.',
    badEmail: 'Please check your email address.'
  };

  // Header: show the bottom rule once the page scrolls.
  var top = document.getElementById('top');
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Collections slider.
  var slider = document.querySelector('[data-slider]');
  if (slider) {
    var track = slider.querySelector('.track');
    var slides = track.querySelectorAll('.slide');
    var prev = document.querySelector('[data-slide-prev]');
    var next = document.querySelector('[data-slide-next]');
    var count = document.querySelector('[data-slide-count]');
    var last = slides.length - 1;
    var i = 0;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var render = function () {
      track.style.setProperty('--i', i);
      count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
      prev.disabled = i === 0;
      next.disabled = i === last;
      slides.forEach(function (s, k) {
        s.toggleAttribute('inert', k !== i);
        s.setAttribute('aria-hidden', k !== i ? 'true' : 'false');
      });
    };
    prev.addEventListener('click', function () { i = Math.max(0, i - 1); render(); });
    next.addEventListener('click', function () { i = Math.min(last, i + 1); render(); });
    render();
  }

  // Showroom booking form.
  var book = document.getElementById('bookForm');
  if (book) {
    var status = document.getElementById('bookStatus');
    var dateInput = book.querySelector('input[type="date"]');
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

    book.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = [];
      var firstBad = null;
      book.querySelectorAll('[required]').forEach(function (el) {
        if (el.type === 'checkbox') return;
        if (!el.value.trim() || !el.checkValidity()) {
          var label = el.closest('label').querySelector('span');
          missing.push(label ? label.textContent.trim() : el.name);
          firstBad = firstBad || el;
        }
      });
      var consent = book.querySelector('input[name="consent"]');
      status.className = 'status err';
      if (missing.length) {
        status.textContent = t.missing + missing.join(', ');
        firstBad.focus();
        return;
      }
      if (consent && !consent.checked) {
        status.textContent = t.consent;
        consent.focus();
        return;
      }
      status.className = 'status ok';
      status.textContent = t.booked;
      book.reset();
    });
  }

  // Newsletter.
  var news = document.getElementById('newsForm');
  if (news) {
    var newsStatus = document.getElementById('newsStatus');
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = news.querySelector('input[type="email"]');
      if (!email.value.trim() || !email.checkValidity()) {
        newsStatus.className = 'news-status err';
        newsStatus.textContent = t.badEmail;
        email.focus();
        return;
      }
      newsStatus.className = 'news-status ok';
      newsStatus.textContent = t.subscribed;
      news.reset();
    });
  }
})();
