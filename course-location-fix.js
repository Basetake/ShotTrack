// ShotTrack V2 course-location repair.
// Keeps OpenGolf search coordinates authoritative and repairs legacy rounds
// that were accidentally saved with the Hidden Valley fallback center.
(() => {
  const FALLBACK = { lat: 40.5363, lng: -111.8345 };
  const valid = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
  const sameAsFallback = c => c && Math.abs(Number(c.lat)-FALLBACK.lat)<0.00001 && Math.abs(Number(c.lng)-FALLBACK.lng)<0.00001;

  const originalSelectCourse = selectCourse;
  selectCourse = async function(c) {
    // Preserve the coordinates returned by the search result. Course-detail
    // responses can contain null/missing coordinates and must not overwrite them.
    const searchLat = Number(c?.lat ?? c?.latitude);
    const searchLng = Number(c?.lng ?? c?.lon ?? c?.longitude);
    await originalSelectCourse(c);
    if (selectedCourse && valid(searchLat, searchLng)) {
      selectedCourse.lat = searchLat;
      selectedCourse.lng = searchLng;
      selectedCourse._searchCenter = { lat: searchLat, lng: searchLng };
    }
  };

  const originalBegin = begin;
  begin = function() {
    if (selectedCourse?._searchCenter) {
      selectedCourse.lat = selectedCourse._searchCenter.lat;
      selectedCourse.lng = selectedCourse._searchCenter.lng;
    }
    originalBegin();
  };
  $('beginBtn').onclick = begin;

  async function repairCurrentRoundCenter() {
    const r = store.getCurrent();
    if (!r?.courseId) return false;
    // Only repair legacy rounds whose center is missing or is the old hard-coded
    // Hidden Valley fallback while the selected course is something else.
    const needsRepair = !valid(r.courseCenter?.lat, r.courseCenter?.lng) ||
      (sameAsFallback(r.courseCenter) && !/hidden valley/i.test(r.course || ''));
    if (!needsRepair) return false;

    try {
      // Search by the saved course name because OpenGolf search results expose
      // the reliable top-level lat/lng used during course selection.
      const res = await fetch(`https://api.opengolfapi.org/v1/courses/search?q=${encodeURIComponent(r.course || '')}`);
      if (!res.ok) return false;
      const data = await res.json();
      const courses = data.courses || [];
      const match = courses.find(c => c.id === r.courseId) ||
        courses.find(c => String(c.course_name || '').toLowerCase() === String(r.course || '').toLowerCase());
      if (!match || !valid(match.lat, match.lng)) return false;
      r.courseCenter = { lat: Number(match.lat), lng: Number(match.lng) };
      store.setCurrent(r);
      return true;
    } catch {
      return false;
    }
  }

  const originalResume = resume;
  resume = async function() {
    await repairCurrentRoundCenter();
    originalResume();
  };
  $('resumeBtn').onclick = resume;

  // If a legacy round is already open when this script loads, repair it and
  // recenter the live map without forcing the user to start over.
  if (typeof round !== 'undefined' && round) {
    repairCurrentRoundCenter().then(changed => {
      if (!changed) return;
      const repaired = store.getCurrent();
      if (repaired?.courseCenter) {
        round.courseCenter = repaired.courseCenter;
        if (map) map.setView([repaired.courseCenter.lat, repaired.courseCenter.lng], 17);
      }
    });
  }
})();