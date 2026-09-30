import type { ApiRequest, Environment } from '../types/api';
import { buildResolvedUrl, buildResolvedHeaders } from './apiExecutor';
import { generateCurlCommand } from './curlParser';

export type SupportedLanguage =
  | 'curl'
  | 'javascript-fetch'
  | 'javascript-axios'
  | 'python-requests'
  | 'python-httpx'
  | 'go'
  | 'java'
  | 'php';

export function generateCodeSnippet(
  lang: SupportedLanguage,
  request: ApiRequest,
  environment?: Environment
): string {
  const url = buildResolvedUrl(request, environment) || 'https://api.example.com/v1/resource';
  const headers = buildResolvedHeaders(request, environment);
  const method = request.method;

  let bodyStr = '';
  if (method !== 'GET' && method !== 'HEAD' && request.body.type !== 'none') {
    if (request.body.type === 'json' && request.body.jsonContent.trim()) {
      bodyStr = request.body.jsonContent;
    } else if (request.body.type === 'raw' && request.body.rawText.trim()) {
      bodyStr = request.body.rawText;
    }
  }

  switch (lang) {
    case 'curl':
      return generateCurlCommand(request, environment);

    case 'javascript-fetch': {
      const options: any = {
        method,
        headers,
      };
      if (bodyStr) {
        options.body = request.body.type === 'json' ? 'JSON_BODY_PLACEHOLDER' : bodyStr;
      }
      let optStr = JSON.stringify(options, null, 2);
      if (bodyStr && request.body.type === 'json') {
        optStr = optStr.replace('"JSON_BODY_PLACEHOLDER"', `JSON.stringify(${bodyStr.trim()})`);
      }
      return `const response = await fetch("${url}", ${optStr});\nconst data = await response.json();\nconsole.log(data);`;
    }

    case 'javascript-axios': {
      let code = `import axios from 'axios';\n\n`;
      const config: any = {
        method: method.toLowerCase(),
        url,
        headers,
      };
      if (bodyStr) {
        config.data = request.body.type === 'json' ? 'JSON_DATA_PLACEHOLDER' : bodyStr;
      }
      let cfgStr = JSON.stringify(config, null, 2);
      if (bodyStr && request.body.type === 'json') {
        cfgStr = cfgStr.replace('"JSON_DATA_PLACEHOLDER"', bodyStr.trim());
      }
      code += `const response = await axios(${cfgStr});\nconsole.log(response.data);`;
      return code;
    }

    case 'python-requests': {
      let code = `import requests\n\nurl = "${url}"\n`;
      code += `headers = ${JSON.stringify(headers, null, 4)}\n`;
      if (bodyStr && request.body.type === 'json') {
        code += `payload = ${bodyStr.trim()}\n\n`;
        code += `response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)\n`;
      } else if (bodyStr) {
        code += `data = """${bodyStr}"""\n\n`;
        code += `response = requests.${method.toLowerCase()}(url, headers=headers, data=data)\n`;
      } else {
        code += `\nresponse = requests.${method.toLowerCase()}(url, headers=headers)\n`;
      }
      code += `print(response.status_code)\nprint(response.json())`;
      return code;
    }

    case 'python-httpx': {
      let code = `import httpx\n\nurl = "${url}"\n`;
      code += `headers = ${JSON.stringify(headers, null, 4)}\n\n`;
      code += `with httpx.Client() as client:\n`;
      if (bodyStr && request.body.type === 'json') {
        code += `    payload = ${bodyStr.trim()}\n`;
        code += `    response = client.${method.toLowerCase()}(url, headers=headers, json=payload)\n`;
      } else {
        code += `    response = client.${method.toLowerCase()}(url, headers=headers)\n`;
      }
      code += `    print(response.status_code)\n    print(response.text)`;
      return code;
    }

    case 'go': {
      return `package main

import (
\t"fmt"
\t"io"
\t"net/http"
\t"strings"
)

func main() {
\turl := "${url}"
\tvar body io.Reader
${bodyStr ? `\tbody = strings.NewReader(\`${bodyStr}\`)\n` : ''}
\treq, err := http.NewRequest("${method}", url, body)
\tif err != nil {
\t\tpanic(err)
\t}

${Object.entries(headers)
  .map(([k, v]) => `\treq.Header.Add("${k}", "${v}")`)
  .join('\n')}

\tres, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer res.Body.Close()

\tbodyBytes, _ := io.ReadAll(res.Body)
\tfmt.Println(res.Status)
\tfmt.Println(string(bodyBytes))
}`;
    }

    case 'java': {
      return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
${Object.entries(headers)
  .map(([k, v]) => `            .header("${k}", "${v}")`)
  .join('\n')};

${
  bodyStr
    ? `        builder.method("${method}", HttpRequest.BodyPublishers.ofString("${bodyStr.replace(/"/g, '\\"')}"));`
    : `        builder.method("${method}", HttpRequest.BodyPublishers.noBody());`
}

        HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}`;
    }

    case 'php': {
      return `<?php

$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_URL => '${url}',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => '${method}',
${bodyStr ? `    CURLOPT_POSTFIELDS => '${bodyStr.replace(/'/g, "\\'")}',\n` : ''}    CURLOPT_HTTPHEADER => array(
${Object.entries(headers)
  .map(([k, v]) => `        '${k}: ${v}',`)
  .join('\n')}
    ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $response;
}`;
    }
  }
}
