import assert from 'node:assert/strict';
import test from 'node:test';
import { AFRICANIES_EXTERNAL_ELEMENTS, ANGULAR_FRAMEWORK_DIFFERENCES, CameraCaptureDialogComponent, FilePreviewDialogComponent, GooglePlacesService, SelectComponent, acceptLabels, fileExtensionLabel, fileMatchesAccept, provideGooglePlaces } from '../packages/ui/dist/index.js';

test('Google Places uses injected fetch, REST field masks, restricted key header and normalized regions', async () => {
  const calls = [];
  const fetch = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ suggestions: [{ placePrediction: { placeId: 'places/1', text: { text: 'Lagos' } } }] }), { headers: { 'content-type': 'application/json' } }); };
  const service = provideGooglePlaces({ apiKey: ' test-key ', region: 'NG', language: 'en' }, fetch);
  assert.deepEqual(await service.getPredictions(' Lagos '), [{ placeId: 'places/1', description: 'Lagos', mainText: undefined, secondaryText: undefined }]);
  assert.equal(calls[0].init.headers['X-Goog-Api-Key'], 'test-key');
  assert.equal(calls[0].url.includes('test-key'), false);
  assert.deepEqual(JSON.parse(calls[0].init.body).includedRegionCodes, ['ng']);
  assert.equal(new GooglePlacesService({ config: { apiKey: '' }, fetch }).getPredictions('x') instanceof Promise, true);
});
test('Google Places maps structured details and surfaces safe API errors', async () => {
  const fetch = async () => new Response(JSON.stringify({ id: 'x', formattedAddress: 'Lagos, Nigeria', location: { latitude: 6.5, longitude: 3.3 }, addressComponents: [{ longText: 'Nigeria', shortText: 'NG', types: ['country'] }] }), { headers: { 'content-type': 'application/json' } });
  const place = await provideGooglePlaces({ apiKey: 'key' }, fetch).getPlaceDetails('places/x');
  assert.equal(place.countryCode, 'NG'); assert.equal(place.lat, 6.5);
  const denied = provideGooglePlaces({ apiKey: 'key' }, async () => new Response('', { status: 403 }));
  await assert.rejects(() => denied.getPredictions('Lagos'), /Enable Places API/);
});
test('file accept helpers match native MIME/extensions without an upload backend', () => {
  assert.equal(fileMatchesAccept({ name: 'invoice.PDF', type: 'application/pdf' }, 'image/*,.pdf'), true);
  assert.equal(fileMatchesAccept({ name: 'script.js', type: 'text/javascript' }, 'image/*,.pdf'), false);
  assert.deepEqual(acceptLabels('image/*,.pdf,application/pdf'), ['Images', 'PDF']);
  assert.equal(fileExtensionLabel('archive.tar.gz'), 'GZ');
});
test('external custom elements and framework-difference audit are explicit', () => {
  assert.equal(Object.keys(AFRICANIES_EXTERNAL_ELEMENTS).length, 4);
  assert.equal(ANGULAR_FRAMEWORK_DIFFERENCES.length, 6);
  assert.ok(ANGULAR_FRAMEWORK_DIFFERENCES.every(item => item.status === 'translated'));
  assert.equal(CameraCaptureDialogComponent.supported(undefined), false);
});
test('camera dialog capability is injected and every acquired media track is stopped', async () => {
  let stopped = 0;
  const stream = { getTracks: () => [{ stop: () => { stopped += 1; } }] };
  const camera = new CameraCaptureDialogComponent();
  camera.mediaDevices = { getUserMedia: async () => stream };
  assert.equal(await camera.start(), true);
  camera.stop();
  assert.equal(stopped, 1);
});
test('preview dialog and select create expose meaningful data/config contracts', () => {
  const preview = new FilePreviewDialogComponent();
  preview.data = { file: { name: 'invoice.pdf' }, previewUrl: 'blob:preview' };
  assert.equal(preview.data.file.name, 'invoice.pdf');
  const select = new SelectComponent();
  select.create = { label: 'Create warehouse', component: {}, data: { country: 'NG' }, mapResult: result => ({ label: result.name, value: result.id }) };
  assert.equal(select.create.label, 'Create warehouse');
});
