import http.server, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Serving: {os.getcwd()}")
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=9001, bind="127.0.0.1")
