import requests

url = "http://20.166.126.59:5000/api/work"

try:
    response = requests.post(url)

    print("Status Code:", response.status_code)
    print("Response Body:", response.text)

except requests.exceptions.RequestException as e:
    print("Error:", e)