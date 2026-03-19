import requests

response = requests.get("http://104.46.15.68:5000/work")

print(response.status_code)
print(response.text)