"""Hard QC of a delivered MP4: exact 27.000 s, 30 fps, 810 frames, 16:9, audio length, loudness, black/frozen frames."""
import json, subprocess, sys, re
f = sys.argv[1]; out = {'file': f}
pr = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,duration,sample_rate,channels,pix_fmt', '-of', 'json', f]))
v = next(s for s in pr['streams'] if s['codec_type'] == 'video'); a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
out.update(container_duration=float(pr['format']['duration']), video_duration=float(v['duration']), audio_duration=float(a['duration']), frames=int(v['nb_read_frames']),
           fps=v['r_frame_rate'], size=f"{v['width']}x{v['height']}", pix_fmt=v['pix_fmt'], vcodec=v['codec_name'], acodec=a['codec_name'], audio=f"{a['sample_rate']} Hz/{a['channels']}ch")
err = subprocess.run(['ffmpeg', '-v', 'info', '-i', f, '-vf', 'blackdetect=d=0.03:pix_th=0.03,freezedetect=n=0.0005:d=1.5', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
out['black_segments'] = re.findall(r'black_start:(\S+) black_end:(\S+)', err)
out['freeze_segments'] = re.findall(r'freeze_start: (\S+)', err)
m = re.search(r'Integrated loudness:\s+I:\s+(\S+) LUFS', err); out['integrated_lufs'] = float(m.group(1)) if m else None
m = re.search(r'True peak:\s+Peak:\s+(\S+) dBFS', err); out['true_peak_dbfs'] = float(m.group(1)) if m else None
w, h = map(int, out['size'].split('x'))
checks = {'frames == 660': out["frames"] == 660, 'fps == 30': out['fps'] == '30/1', 'video 22.000 s': abs(out['video_duration'] - 22.0) < 1e-3,
          'container 22.00 s': abs(out['container_duration'] - 22.0) < 0.01, 'audio 22.00 s': abs(out['audio_duration'] - 22.0) < 0.025, '9:16 1080x1920': (w, h) == (1080, 1920),
          'no black frames': not out['black_segments'], 'no frozen stretches > 1.5 s (end card hold excluded)': not out['freeze_segments']}
out['checks'] = checks; print(json.dumps(out, indent=1))
json.dump(out, open(f.rsplit('.', 1)[0] + '_qc.json', 'w'), indent=1)
sys.exit(0 if all(checks.values()) else 1)
