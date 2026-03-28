# Hướng dẫn train giọng nói (Tiếng Việt)

Tài liệu này mô tả cách train hoặc fine-tune một giọng Piper-compatible, export sang ONNX, rồi nạp lại vào `voice-desk-tts`.

## 1. Phạm vi

Repo này khuyến nghị dùng notebook Colab chính tại [`colab-train/voice_desk_tts_colab.ipynb`](../colab-train/voice_desk_tts_colab.ipynb) cho toàn bộ luồng train và fine-tune.

Luồng chuẩn là:

1. chuẩn bị dữ liệu
2. train hoặc fine-tune bằng Colab
3. export `.onnx` + `.onnx.json`
4. copy model sang `public/tts-model/<lang>/`

## 2. Môi trường khuyến nghị

Train dễ nhất trên Linux hoặc WSL2.

Nên có:

- Python 3.10 hoặc 3.11
- `espeak-ng`
- `ffmpeg`
- `git`
- `build-essential`, `cmake`, `ninja-build`
- GPU CUDA nếu có

Kinh nghiệm thực tế:

- 8 GB VRAM vẫn có thể fine-tune dữ liệu nhỏ
- 12-24 GB VRAM thoải mái hơn nhiều
- train bằng CPU được nhưng rất chậm

## 3. Cài môi trường train

Dùng notebook Colab đi kèm làm đường chuẩn:

```text
colab-train/voice_desk_tts_colab.ipynb
```

Notebook này đã bao gồm phần cài dependency, clone repo train, tải checkpoint base, train, export và test nhanh.

## 4. Chuẩn bị dataset

### Yêu cầu audio

Nên giữ dataset càng đồng nhất càng tốt:

- một speaker cho một model single-speaker
- audio mono là tốt nhất
- toàn bộ dataset cùng sample rate, thường là `22050`
- ít noise, ít reverb, ít clipping
- cắt bớt khoảng lặng quá dài

### Cấu trúc thư mục ví dụ

```text
datasets/
  vi_female_01/
    audio/
      utt0001.wav
      utt0002.wav
    metadata.csv
```

### Định dạng `metadata.csv`

Dùng dấu `|`:

```text
utt0001.wav|Xin chào, đây là câu đọc thứ nhất.
utt0002.wav|Hôm nay trời đẹp và rất yên tĩnh.
```

Quy ước:

- cột 1: tên file audio
- cột 2: transcript tương ứng

Tên file ở cột 1 phải tồn tại trong thư mục `--data.audio_dir`.

### Mẹo làm dữ liệu tốt

- giữ cùng micro, cùng phòng thu nếu có thể
- không trộn nhiều kiểu nói vào cùng một voice
- bỏ nhạc nền và echo mạnh
- chuẩn hóa âm lượng nhẹ nhàng, đừng ép compressor quá tay
- sửa transcript sai trước khi train

## 5. Chọn voice cho phonemizer

Liệt kê voice của `espeak-ng`:

```bash
espeak-ng --voices
```

Chọn voice khớp với ngôn ngữ đang train. Ví dụ thường gặp:

- English: `en-us`
- Vietnamese: dùng voice tiếng Việt đang có trong bản `espeak-ng` cài trên máy
- Indonesian: dùng voice tiếng Indonesia đang có trong bản `espeak-ng` cài trên máy

Không nên đoán trước vì mỗi bản cài `espeak-ng` có thể khác nhau.

## 6. Chạy train hoặc fine-tune

Hãy dùng notebook Colab để chạy đầy đủ lệnh train trong môi trường đã chuẩn bị sẵn.

Notebook Colab cũng đã đi theo hướng fine-tune từ checkpoint base, đây vẫn là cách nên dùng trong thực tế.

Ý nghĩa các tham số chính:

- `data.voice_name`: tên nội bộ của run
- `data.csv_path`: file transcript
- `data.audio_dir`: thư mục audio
- `model.sample_rate`: phải khớp sample rate của audio
- `data.espeak_voice`: voice phonemizer
- `data.cache_dir`: nơi cache feature sau tiền xử lý
- `data.config_path`: nơi ghi file config JSON
- `data.batch_size`: batch size, phụ thuộc VRAM
- `ckpt_path`: checkpoint để fine-tune

## 7. Lưu ý riêng cho tiếng Việt

- Chỉ nên giữ một accent trong một dataset, ví dụ Bắc hoặc Nam.
- Chuẩn hóa cách đọc số, ngày tháng, tiền tệ, viết tắt và từ tiếng Anh.
- Nếu transcript có nhiều số, nên viết lại theo cách đọc mong muốn trước khi train.
- Không nên trộn chính tả quá trang trọng với kiểu nói quá đời thường nếu giọng đích không thực sự dùng cả hai.

## 8. Lưu ý riêng cho tiếng Anh

- English thường fine-tune tốt từ checkpoint `en_US`.
- Nếu corpus có nhiều từ viết tắt, nên normalize trước.
- Dấu câu ảnh hưởng nhịp ngắt nghỉ, đừng bỏ bừa hoặc thêm bừa.

## 9. Theo dõi chất lượng trong lúc train

Nên nghe sample định kỳ để bắt các lỗi:

- phát âm lệch
- ngắt nghỉ không ổn định
- nguyên âm bị méo, robotic
- cuối câu bị cụt
- model học cả noise của dữ liệu

Nếu chất lượng không lên:

- dọn dataset lại
- sửa transcript sai
- giảm batch size nếu VRAM chập chờn
- dùng checkpoint khởi đầu gần hơn thay vì train từ đầu

## 10. Export sang ONNX

Hãy dùng bước export có sẵn trong notebook Colab để tạo cặp file ONNX cuối cùng.

Bạn cần đúng 2 file cùng basename:

- `vi_VN-custom-medium.onnx`
- `vi_VN-custom-medium.onnx.json`

File `.onnx.json` là file config đã được ghi ra lúc train qua `--data.config_path`.

## 11. Đưa model vào web app

Khi chạy local, copy model vào:

```text
public/
  tts-model/
    vi/
      vi_VN-custom-medium.onnx
      vi_VN-custom-medium.onnx.json
```

App hiện tại đang có sẵn các thư mục ngôn ngữ:

- tiếng Việt: `public/tts-model/vi/`
- tiếng Anh: `public/tts-model/en/`
- tiếng Indonesia: `public/tts-model/id/`

Khi deploy production, upload cùng cặp file này lên object storage theo prefix tương ứng:

- `piper/vi/`
- `piper/en/`
- `piper/id/`

Nếu bạn thêm ngôn ngữ mới, hãy giữ cho tên thư mục local và prefix production khớp với config của app.

## 12. Troubleshooting nhanh

### Model load được nhưng đọc sai

- kiểm tra sample rate
- kiểm tra transcript có khớp audio không
- kiểm tra `espeak-ng` voice đã chọn đúng chưa

### Train bị OOM

- giảm `--data.batch_size`
- dùng checkpoint nhỏ hơn hoặc giảm tải song song

### Phát âm không ổn định

- dọn lại dấu câu và chữ số
- bỏ các audio lỗi
- tăng độ đồng nhất của dataset

### Chưa ra đúng chất giọng

- thêm dữ liệu cùng speaker
- fine-tune từ checkpoint gần hơn
- bỏ các bản ghi lệch style

## 13. Nhắc lại về pháp lý

Trước khi public một giọng đã train:

- cần có quyền sử dụng giọng / dữ liệu
- cần kiểm tra quyền redistribute dataset
- cần đọc điều khoản của checkpoint hoặc voice card đi kèm
- nên lưu ghi chú license cùng model export
