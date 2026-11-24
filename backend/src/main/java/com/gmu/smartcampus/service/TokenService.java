package com.gmu.smartcampus.service;

import com.gmu.smartcampus.entity.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
public class TokenService {
    @Value("${app.jwt.secret}") private String secret;
    private String sign(String value) throws Exception {
        Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
    public String issue(UserAccount u) {
        try {
            String header=Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            String payloadJson="{\"sub\":\""+u.getId()+"\",\"role\":\""+u.getRole()+"\",\"exp\":"+(Instant.now().getEpochSecond()+28800)+"}";
            String payload=Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String unsigned=header+"."+payload; return unsigned+"."+sign(unsigned);
        } catch(Exception e){throw new IllegalStateException(e);}
    }
    public Long userId(String token) {
        try {
            String[] p=token.split("\\."); if(p.length!=3 || !sign(p[0]+"."+p[1]).equals(p[2])) return null;
            String json=new String(Base64.getUrlDecoder().decode(p[1]),StandardCharsets.UTF_8);
            java.util.regex.Matcher sub=java.util.regex.Pattern.compile("\"sub\":\"([0-9]+)\"").matcher(json);
            java.util.regex.Matcher exp=java.util.regex.Pattern.compile("\"exp\":([0-9]+)").matcher(json);
            if(!sub.find()||!exp.find()||Long.parseLong(exp.group(1))<Instant.now().getEpochSecond()) return null;
            return Long.parseLong(sub.group(1));
        } catch(Exception e){return null;}
    }
}
