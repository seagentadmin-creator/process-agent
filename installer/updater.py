"""Process Agent Native Update Host"""
import sys, json, struct, os, zipfile, tempfile
from urllib.request import urlopen, Request

def read_msg():
    raw = sys.stdin.buffer.read(4)
    if not raw:
        return None
    length = struct.unpack('I', raw)[0]
    return json.loads(sys.stdin.buffer.read(length).decode())

def send_msg(msg):
    data = json.dumps(msg).encode()
    sys.stdout.buffer.write(struct.pack('I', len(data)) + data)
    sys.stdout.buffer.flush()

def update(install_dir, owner, repo):
    try:
        url = f'https://api.github.com/repos/{owner}/{repo}/releases/latest'
        with urlopen(Request(url, headers={'User-Agent': 'PA'}), timeout=30) as r:
            rel = json.loads(r.read())
        zip_url = next(
            (a['browser_download_url'] for a in rel.get('assets', []) if a['name'].endswith('.zip')),
            None
        )
        if not zip_url:
            return {'success': False, 'error': 'No zip asset found'}
        tmp = os.path.join(tempfile.gettempdir(), 'pa-update.zip')
        with urlopen(Request(zip_url, headers={'User-Agent': 'PA'}), timeout=120) as r:
            with open(tmp, 'wb') as f:
                f.write(r.read())
        with zipfile.ZipFile(tmp, 'r') as z:
            z.extractall(install_dir)
        os.remove(tmp)
        return {'success': True, 'version': rel['tag_name']}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    msg = read_msg()
    if not msg:
        sys.exit(0)
    action = msg.get('action', '')
    if action == 'update':
        send_msg(update(msg.get('installDir', ''), msg.get('owner', ''), msg.get('repo', '')))
    elif action == 'check':
        try:
            url = f"https://api.github.com/repos/{msg['owner']}/{msg['repo']}/releases/latest"
            with urlopen(Request(url, headers={'User-Agent': 'PA'}), timeout=30) as r:
                send_msg(json.loads(r.read()))
        except Exception as e:
            send_msg({'error': str(e)})
