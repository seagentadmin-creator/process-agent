"""Process Agent Native Update Host — GitHub Enterprise 지원"""
import sys, json, struct, os, zipfile, tempfile, configparser
from urllib.request import urlopen, Request

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pa-config.ini')

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

def load_config():
    """pa-config.ini에서 GitHub 설정 로드"""
    config = {'api': 'https://api.github.com', 'owner': '', 'repo': ''}
    if os.path.exists(CONFIG_FILE):
        cp = configparser.ConfigParser()
        cp.read(CONFIG_FILE)
        if cp.has_section('ProcessAgent'):
            config['api'] = cp.get('ProcessAgent', 'GITHUB_API', fallback='https://api.github.com')
            config['owner'] = cp.get('ProcessAgent', 'GITHUB_OWNER', fallback='')
            config['repo'] = cp.get('ProcessAgent', 'GITHUB_REPO', fallback='')
    return config

def get_api_url(api_base, owner, repo):
    return f'{api_base}/repos/{owner}/{repo}/releases/latest'

def update(install_dir, owner=None, repo=None, api_url=None):
    try:
        cfg = load_config()
        owner = owner or cfg['owner']
        repo = repo or cfg['repo']
        api_base = api_url or cfg['api']
        url = get_api_url(api_base, owner, repo)
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
        send_msg(update(
            msg.get('installDir', ''),
            msg.get('owner'), msg.get('repo'), msg.get('apiUrl'),
        ))
    elif action == 'check':
        try:
            cfg = load_config()
            owner = msg.get('owner') or cfg['owner']
            repo = msg.get('repo') or cfg['repo']
            api_base = msg.get('apiUrl') or cfg['api']
            url = get_api_url(api_base, owner, repo)
            with urlopen(Request(url, headers={'User-Agent': 'PA'}), timeout=30) as r:
                send_msg(json.loads(r.read()))
        except Exception as e:
            send_msg({'error': str(e)})
