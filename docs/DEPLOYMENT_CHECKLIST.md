# Deployment Checklist

Quick reference guide for deploying the Vehicles Management application.

## Pre-Deployment Checks

### Code Quality

- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console errors in development mode

### Environment Variables

- [ ] `.env` file configured with all required variables
- [ ] GitHub Secrets configured for CI/CD
- [ ] Netlify environment variables set
- [ ] Supabase credentials valid and accessible

### Build Tests

#### Local Build Tests

```bash
# Clear caches first
rm -rf node_modules .expo dist
npm install

# Test Android build (if applicable)
npm run android

# Test Web build
npm run web

# Test production web export
NODE_ENV=production npm run build
```

#### Verify Builds

- [ ] Android build completes without errors
- [ ] Web build completes without errors
- [ ] No module resolution errors
- [ ] No worklets errors on web
- [ ] All routes accessible
- [ ] Images load correctly

## GitHub Actions (Android APK)

### Workflow Location

`.github/workflows/build-production-apk.yml`

### Environment Requirements

- **Node Version**: 20.18.2
- **Java Version**: 17
- **NDK Version**: 27.3.13750724

### Secrets Required

- `EXPO_TOKEN`: EAS authentication token
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anon key
- `GOOGLE_VISION_API_KEY`: Google Vision API key
- `SITE_URL`: Application site URL

### Pre-Push Checklist

- [ ] All changes committed
- [ ] `eas.json` configured correctly
- [ ] Build credentials exist in EAS
- [ ] Secrets configured in GitHub repository settings

### Build Process

1. Push to `main` branch
2. GitHub Actions triggers automatically
3. Monitor build in Actions tab
4. Download APK from workflow artifacts

### Troubleshooting

**Build fails with "module not found"**:

- Check that index files exist for all component directories
- Verify babel.config.js has correct aliases
- Clear EAS cache: Set `cache.clear: true` in eas.json temporarily

**Build succeeds but APK not found**:

- Check workflow output for APK location
- Verify `--output` flag in EAS command
- Check artifact upload step

## Netlify Deployment (Web)

### Configuration File

`netlify.toml`

### Build Settings

- **Build Command**: `rm -f package-lock.json && npm install --force lightningcss && npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 20 (specified in environment)

### Environment Variables

Configure in Netlify dashboard:

- `BREVO_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `SENDER_EMAIL`
- `SENDER_NAME`
- `SITE_URL`
- `SUPABASE_KEY`
- `SUPABASE_URL`
- `NODE_VERSION`: 20
- `EXPO_PLATFORM`: web
- `EXPO_USE_FAST_RESOLVER`: true
- `USE_SIMPLE_CSS_MINIFIER`: true

### Pre-Deploy Checklist

- [ ] All changes committed and pushed
- [ ] Environment variables set in Netlify
- [ ] `netlify.toml` configured correctly
- [ ] Local production build tested

### Deploy Process

1. Push to `main` branch (or trigger manual deploy)
2. Netlify auto-deploys
3. Monitor build logs in Netlify dashboard
4. Check deploy preview before going live

### Troubleshooting

**Worklets error during build**:

- Verify `polyfills/react-native-worklets.web.ts` exists
- Check metro.config.js has resolveRequest for web
- Check babel.config.js has worklets alias

**Build succeeds but site broken**:

- Check browser console for errors
- Verify environment variables are set
- Check routing configuration
- Test locally with `npm run build && npx serve dist`

## Post-Deployment Verification

### Android APK

- [ ] Install APK on test device
- [ ] Test critical user flows
- [ ] Verify Supabase connectivity
- [ ] Test image uploads
- [ ] Verify navigation works
- [ ] Check performance

### Web Application

- [ ] Visit deployed URL
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify all routes accessible
- [ ] Test authentication flow
- [ ] Check API connectivity
- [ ] Verify images load
- [ ] Test forms and data submission

## Rollback Procedures

### GitHub Actions

1. Navigate to previous successful workflow run
2. Download APK artifact from that run
3. Distribute previous APK version

### Netlify

1. Go to Netlify dashboard
2. Navigate to "Deploys" tab
3. Find previous successful deploy
4. Click "Publish deploy" on the old version

## Monitoring

### Key Metrics to Watch

- Build success rate
- Deploy time
- Error rates in production
- API response times
- User-reported issues

### Logs to Monitor

- GitHub Actions build logs
- Netlify deploy logs
- Browser console errors
- Supabase logs
- API error logs

## Emergency Contacts

### Services

- **Expo/EAS**: https://expo.dev/accounts/[account]/projects
- **Netlify**: https://app.netlify.com
- **Supabase**: https://app.supabase.com
- **GitHub Actions**: https://github.com/[org]/[repo]/actions

### Documentation

- Build Fixes: `/docs/BUILD_FIXES.md`
- Full-Stack Guide: `/docs/fullstack-developer.md`
- DevOps Guide: `/.claude/agents/devops-engineer.md`

## Version History

### Current Version: 1.0.0

**Latest Changes** (2025-12-28):

- Fixed module resolution for production builds
- Added web polyfills for react-native-worklets
- Enhanced metro and babel configurations
- Improved component import structure

---

**Last Updated**: December 28, 2025
**Maintained By**: Development Team
