# Grayjay Stremio Plugin 🚀

A full-stack, open-source Grayjay plugin that seamlessly bridges your favorite Stremio Addons into the Grayjay app. Search for movies and shows on Grayjay and watch them using high-quality streams directly from your personal Stremio addons!

Built completely via vibe coding with AI agents. 🤖✨

## Setup in 3 Steps
1. **Deploy to Netlify:** Fork this repo and deploy it to Netlify. Set the Framework to `Next.js` and configure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.
2. **Setup Supabase:** Create a Supabase project and run the provided `schema.sql` to setup your database and security rules.
3. **Use in Grayjay:** Go to the live website, add your TMDB API Key and Stremio Addon URLs, and save. Then, add your site URL (`https://your-site.netlify.app/plugin/Config.json`) as a new source in Grayjay!

## License 📄
MIT License - fully open and free. Do whatever you want with it!
