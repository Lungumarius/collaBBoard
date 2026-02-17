package com.smartexpenses.whiteboard.exception;

import org.springframework.http.HttpStatus;

public class WhiteboardException extends RuntimeException {

    private final HttpStatus status;

    public WhiteboardException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
