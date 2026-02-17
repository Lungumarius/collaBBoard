package com.smartexpenses.whiteboard.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends WhiteboardException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
