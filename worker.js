// Canonical-host redirect in front of the static site. Everything else is served from assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'rvtwzd.com') {
      url.hostname = 'www.rvtwzd.com';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
