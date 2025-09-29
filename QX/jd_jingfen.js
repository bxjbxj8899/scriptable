[mitm]
hostname = *.jd.com

[rewrite_local]
^https://item\.jd\.com/.*\.html url script-response-body https://raw.githubusercontent.com/username/repo/main/jd_jingfen.js
^https://union\.jd\.com/api/receivecode/getCode url script-response-body https://raw.githubusercontent.com/username/repo/main/jd_jingfen.js
