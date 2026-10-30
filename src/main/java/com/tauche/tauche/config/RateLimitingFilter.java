package com.tauche.tauche.config;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(1)
public class RateLimitingFilter implements Filter {

    private final Map<String, Entry> requestCounts = new ConcurrentHashMap<>();
    private static final long WINDOW_MS = 60_000;
    private static final int AUTH_MAX_PER_WINDOW = 100;
    private static final int API_MAX_PER_WINDOW = 5000;

    private record Entry(int count, long windowStart) {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();

        if (path.startsWith("/api/")) {
            String ip = getClientIp(httpRequest);
            long now = System.currentTimeMillis();

            int maxRequests = path.startsWith("/api/auth/") ? AUTH_MAX_PER_WINDOW : API_MAX_PER_WINDOW;

            Entry entry = requestCounts.compute(ip, (key, val) -> {
                if (val == null || now - val.windowStart > WINDOW_MS) {
                    return new Entry(1, now);
                }
                return new Entry(val.count + 1, val.windowStart);
            });

            if (entry.count > maxRequests) {
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        if (Math.random() < 0.001) {
            evictStale();
        }

        chain.doFilter(request, response);
    }

    private void evictStale() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, Entry>> it = requestCounts.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Entry> e = it.next();
            if (now - e.getValue().windowStart > WINDOW_MS * 2) {
                it.remove();
            }
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}