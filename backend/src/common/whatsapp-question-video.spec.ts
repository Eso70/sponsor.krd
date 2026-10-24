import { questionVideoUrl } from './whatsapp-question-video';
describe('WhatsApp question video validation', () => {
  it('accepts public platform URLs and optional legacy values', () => {
    expect(questionVideoUrl(' https://www.tiktok.com/@shop/video/123 ')).toBe(
      'https://www.tiktok.com/@shop/video/123',
    );
    expect(questionVideoUrl(undefined)).toBeNull();
    expect(questionVideoUrl(' ')).toBeNull();
  });
  it.each([
    'javascript:alert(1)',
    'data:video/mp4;base64,abc',
    'https://user:password@example.com/video',
    'https://example.com/video\nunsafe',
    123,
  ])('rejects unsafe values: %s', (value) => {
    expect(() => questionVideoUrl(value)).toThrow('Enter a valid video link');
  });
});
