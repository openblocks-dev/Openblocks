package com.openblocks.sdk.util;

import static com.openblocks.sdk.util.UriUtils.getRefererURI;
import static java.util.Optional.ofNullable;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpCookie;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseCookie.ResponseCookieBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;

import com.openblocks.sdk.config.CommonConfig;
import com.openblocks.sdk.config.CommonConfig.Cookie;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CookieHelper {

    @Autowired
    private CommonConfig commonConfig;

    public void saveCookie(String token, ServerWebExchange exchange) {
        boolean isUsingHttps = Optional.ofNullable(getRefererURI(exchange.getRequest()))
                .map(a -> "https".equalsIgnoreCase(a.getScheme()))
                .orElse(false);
        ResponseCookieBuilder builder = ResponseCookie.from(getCookieName(), token)
                .path(exchange.getRequest().getPath().contextPath().value() + "/")
                .secure(isUsingHttps)
                .sameSite(isUsingHttps ? "None" : "Lax");
        // set cookie max-age
        Cookie cookie = commonConfig.getCookie();
        if (cookie.getMaxAgeInSeconds() >= 0) {
            builder.maxAge(cookie.getMaxAgeInSeconds());
        }

        if (commonConfig.isCloud()) {
            String topPrivateDomain = UriUtils.getTopPrivateDomain(exchange);
            builder.domain(topPrivateDomain);
        }
        exchange.getResponse().addCookie(builder.build());
    }

    public String getCookieToken(ServerWebExchange exchange) {
        MultiValueMap<String, HttpCookie> cookies = exchange.getRequest().getCookies();
        return ofNullable(cookies.getFirst(getCookieName()))
                .map(HttpCookie::getValue)
                .orElse("");
    }


    public static String generateCookieToken() {
        return UUID.randomUUID().toString();
    }

    public String getCookieName() {
        return commonConfig.getCookieName();
    }
}
